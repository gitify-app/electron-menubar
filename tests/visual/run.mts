#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

import { PNG } from 'pngjs';

// `electron`, required outside the Electron runtime, resolves to the binary
// path. createRequire keeps that CJS behaviour in this ESM (.mts) module.
const require = createRequire(import.meta.url);
const electronBin: string = require('electron');
const fixturePath = join(import.meta.dirname, 'fixture', 'main.js');

const key = process.env.VISUAL_KEY ?? `${process.platform}-local`;
const label = process.env.VISUAL_LABEL ?? key;
const outDir = join(process.cwd(), 'test-results', 'visual');
const screenshotPath = join(outDir, `${key}.png`);
const resultPath = join(outDir, `${key}.json`);
mkdirSync(outDir, { recursive: true });

const READY_TIMEOUT_MS = 30_000;
const POST_READY_DELAY_MS = Number(
  process.env.VISUAL_POST_READY_DELAY_MS ?? 3_000,
);
// After the first capture, a failed pixel-check retries on a fresh screenshot
// every CHECK_RETRY_INTERVAL_MS until CHECK_RETRY_TIMEOUT_MS elapses, so a
// panel that paints the tray icon late still passes. A passing run captures
// exactly once.
const CHECK_RETRY_TIMEOUT_MS = 60_000;
const CHECK_RETRY_INTERVAL_MS = 2_000;
const TRAY_EXACT_THRESHOLD = 50;
const TRAY_SATURATED_FALLBACK = 100;
// Fixture window: white background (~16800 px) with centered 80x40 black
// inner square (~3200 px), total 20000 px. Solid colors eliminate the
// internal-AA drift the cyan/yellow split had. We bound the check to the
// reported window rect so OS chrome white/black doesn't bleed in.
const WINDOW_WHITE_THRESHOLD = 5000;
const WINDOW_BLACK_THRESHOLD = 500;
const RECT_PADDING = 4;
const isWayland = process.platform === 'linux' && !!process.env.WAYLAND_DISPLAY;

// Force --ozone-platform=wayland: hint=auto fell back to X11 in headless CI
// even with WAYLAND_DISPLAY set. --disable-gpu + --no-sandbox keeps CI happy.
const electronArgs = isWayland
  ? [
      '--ozone-platform=wayland',
      '--enable-features=WaylandWindowDecorations',
      '--disable-gpu',
      '--no-sandbox',
      fixturePath,
    ]
  : [fixturePath];

const child = spawn(electronBin, electronArgs, {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, ELECTRON_DISABLE_SANDBOX: '1' },
});

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
interface Bounds {
  tray: Rect;
  window: Rect;
  scale: number;
}

let ready = false;
let windowShown = false;
let bounds: Bounds | null = null;
let stdoutBuf = '';
child.stdout.on('data', (chunk: Buffer) => {
  const s = chunk.toString();
  process.stdout.write(s);
  stdoutBuf += s;
  const lines = stdoutBuf.split('\n');
  stdoutBuf = lines.pop() ?? '';
  for (const line of lines) {
    if (line.includes('VISUAL:ready')) ready = true;
    if (line.includes('VISUAL:window-shown')) windowShown = true;
    const m = line.match(/VISUAL:bounds=(\{.+\})/);
    if (m) {
      try {
        bounds = JSON.parse(m[1]) as Bounds;
      } catch {
        console.error('failed to parse VISUAL:bounds payload:', m[1]);
      }
    }
  }
});
child.stderr.on('data', (chunk: Buffer) => process.stderr.write(chunk));
child.on('exit', (code) => {
  if (!ready)
    console.error(`fixture exited (code=${code}) before VISUAL:ready`);
});

const deadline = Date.now() + READY_TIMEOUT_MS;
while (!ready && Date.now() < deadline && child.exitCode === null) {
  await new Promise((r) => setTimeout(r, 100));
}

if (!ready) {
  child.kill('SIGTERM');
  writeResult({ status: 'fail', reason: 'fixture did not emit ready' });
  process.exit(1);
}

await new Promise((r) => setTimeout(r, POST_READY_DELAY_MS));

if (!windowShown) {
  console.warn('fixture did not emit VISUAL:window-shown before screenshot');
}

const prepareCmd = process.env.VISUAL_PREPARE_CMD;
if (prepareCmd) {
  console.log(`running VISUAL_PREPARE_CMD: ${prepareCmd}`);
  if (process.platform === 'win32') {
    execFileSync('powershell', ['-NoProfile', '-Command', prepareCmd], {
      stdio: 'inherit',
    });
  } else {
    execFileSync('sh', ['-c', prepareCmd], { stdio: 'inherit' });
  }
}

const retryDeadline = Date.now() + CHECK_RETRY_TIMEOUT_MS;
let attempts = 0;
let png: PNG;
let result: Analysis;
for (;;) {
  attempts++;
  try {
    capture(screenshotPath);
  } catch (err) {
    child.kill('SIGTERM');
    writeResult({
      status: 'fail',
      reason: `screenshot failed: ${(err as Error).message}`,
    });
    throw err;
  }
  png = PNG.sync.read(readFileSync(screenshotPath));
  // Bounds arrive asynchronously from the fixture; recompute per attempt so
  // a late VISUAL:bounds line still tightens the window check on retries.
  result = check(png, bounds ? scaleRect(bounds.window, bounds.scale) : null);
  console.log(
    [
      `exactTray=${result.exactTray}`,
      `saturatedNonWindow=${result.saturatedNonWindow}`,
      `windowWhite=${result.windowWhite}`,
      `windowBlack=${result.windowBlack}`,
      `globalWhite=${result.globalWhite}`,
      `globalBlack=${result.globalBlack}`,
      `→ ${result.status}`,
      `(tray=${result.trayDetected}, window=${result.windowDetected}`,
      `bounded=${result.windowDetectedBounded}`,
      `global=${result.windowDetectedGlobal})`,
      `attempt=${attempts}`,
    ].join(' '),
  );
  if (result.status === 'pass' || Date.now() >= retryDeadline) break;
  await new Promise((r) => setTimeout(r, CHECK_RETRY_INTERVAL_MS));
}

child.kill('SIGTERM');

const status = result.status;
writeResult({ ...result, attempts });

// Overwrite the on-disk screenshot with a mask that keeps only the tray-icon
// and popover-window rects. The pixel-check above ran on the original
// full-screen capture; the saved PNG is the clean version for diffing.
if (bounds) {
  const masked = maskToRects(png, bounds);
  writeFileSync(screenshotPath, PNG.sync.write(masked));
  console.log(
    `masked screenshot to tray=${rectStr(bounds.tray, bounds.scale)} window=${rectStr(bounds.window, bounds.scale)}`,
  );
} else {
  console.warn('VISUAL:bounds not received; leaving screenshot unmasked');
}

if (status === 'fail') process.exit(1);

interface Analysis {
  status: 'pass' | 'fail';
  exactTray: number;
  saturatedNonWindow: number;
  windowWhite: number;
  windowBlack: number;
  globalWhite: number;
  globalBlack: number;
  trayDetected: boolean;
  windowDetected: boolean;
  windowDetectedBounded: boolean;
  windowDetectedGlobal: boolean;
}

interface PixelClassification {
  tray: boolean;
  saturated: boolean;
  white: boolean;
  black: boolean;
}

// Classify one captured pixel against the tray/window marker colours.
function classifyPixel(r: number, g: number, b: number): PixelClassification {
  const isMagenta = r > 200 && g < 80 && b > 200;
  const isGreen = r < 80 && g > 200 && b < 80;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return {
    tray: isMagenta || isGreen,
    saturated: max > 180 && max - min > 140,
    white: r > 240 && g > 240 && b > 240,
    black: r < 15 && g < 15 && b < 15,
  };
}

interface PixelCounts {
  exactTray: number;
  saturatedNonWindow: number;
  windowWhite: number;
  windowBlack: number;
  globalWhite: number;
  globalBlack: number;
}

// Count marker pixels across the capture. Tray colours are counted globally;
// window colours only inside the reported window rect (when available).
function countPixels(png: PNG, winRect: PixelRect | null): PixelCounts {
  const counts: PixelCounts = {
    exactTray: 0,
    saturatedNonWindow: 0,
    windowWhite: 0,
    windowBlack: 0,
    globalWhite: 0,
    globalBlack: 0,
  };
  for (let y = 0; y < png.height; y++) {
    const inWinY = winRect !== null && y >= winRect.y && y < winRect.y2;
    for (let x = 0; x < png.width; x++) {
      const i = (y * png.width + x) * 4;
      const px = classifyPixel(png.data[i], png.data[i + 1], png.data[i + 2]);
      if (px.tray) counts.exactTray++;
      if (px.saturated) counts.saturatedNonWindow++;
      if (px.white) counts.globalWhite++;
      if (px.black) counts.globalBlack++;
      if (winRect !== null && inWinY && x >= winRect.x && x < winRect.x2) {
        if (px.white) counts.windowWhite++;
        else if (px.black) counts.windowBlack++;
      }
    }
  }
  return counts;
}

// Tray icon: magenta/green checker, detected globally (works on Linux SNI
// where tray.getBounds() returns {0,0,0,0}). Saturated-pixel fallback for
// platforms like KDE Plasma that recolor SNI icons.
// Window content: white box + black inner square, detected only INSIDE the
// reported window rect so OS chrome white/black text doesn't false-positive.
function check(png: PNG, winRect: PixelRect | null): Analysis {
  const counts = countPixels(png, winRect);
  const trayDetected =
    counts.exactTray >= TRAY_EXACT_THRESHOLD ||
    counts.saturatedNonWindow >= TRAY_SATURATED_FALLBACK;
  // Window detected inside the reported bounds OR globally — covers GNOME
  // where Mutter renders the window at a different position than getBounds()
  // reports. Global thresholds set just below the fully-rendered expected
  // counts (16800 white + 3200 black) to reject OS chrome false positives.
  const windowDetectedBounded =
    winRect !== null &&
    counts.windowWhite >= WINDOW_WHITE_THRESHOLD &&
    counts.windowBlack >= WINDOW_BLACK_THRESHOLD;
  // The reported rect holds a painted surface but no inner square: the window
  // is up while the renderer has yet to draw index.html. globalWhite alone
  // counts that blank surface as a rendered window, so the global fallback is
  // withheld here and the caller retries on a fresh capture instead of
  // accepting a contentless window.
  const boundedAwaitingContent =
    winRect !== null &&
    counts.windowWhite >= WINDOW_WHITE_THRESHOLD &&
    counts.windowBlack < WINDOW_BLACK_THRESHOLD;
  // globalBlack varies wildly with wallpaper (macOS black is huge, others are
  // tiny) so we don't use it. globalWhite at >= 14000 reliably signals the
  // rendered white window background even when GNOME's Mutter paints the
  // window at a position that diverges from getBounds().
  const windowDetectedGlobal =
    !boundedAwaitingContent && counts.globalWhite >= 14_000;
  const windowDetected = windowDetectedBounded || windowDetectedGlobal;
  return {
    status: trayDetected && windowDetected ? 'pass' : 'fail',
    exactTray: counts.exactTray,
    saturatedNonWindow: counts.saturatedNonWindow,
    windowWhite: counts.windowWhite,
    windowBlack: counts.windowBlack,
    globalWhite: counts.globalWhite,
    globalBlack: counts.globalBlack,
    trayDetected,
    windowDetected,
    windowDetectedBounded,
    windowDetectedGlobal,
  };
}

function capture(path: string): void {
  if (process.platform === 'darwin') {
    execFileSync('screencapture', ['-x', path], { stdio: 'inherit' });
  } else if (process.platform === 'win32') {
    const ps = [
      'Add-Type -AssemblyName System.Windows.Forms,System.Drawing;',
      '$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds;',
      '$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height;',
      '$g = [System.Drawing.Graphics]::FromImage($bmp);',
      '$g.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size);',
      `$bmp.Save($env:VISUAL_OUT_PATH, [System.Drawing.Imaging.ImageFormat]::Png);`,
    ].join(' ');
    execFileSync('powershell', ['-NoProfile', '-Command', ps], {
      stdio: 'inherit',
      env: { ...process.env, VISUAL_OUT_PATH: path },
    });
  } else if (isWayland) {
    execFileSync('grim', [path], { stdio: 'inherit' });
  } else {
    execFileSync('import', ['-window', 'root', path], { stdio: 'inherit' });
  }
}

function writeResult(payload: Record<string, unknown>): void {
  writeFileSync(
    resultPath,
    JSON.stringify(
      { key, label, ...payload, date: new Date().toISOString() },
      null,
      2,
    ),
  );
}

function rectStr(r: Rect, scale: number): string {
  const w = Math.round(r.width * scale);
  const h = Math.round(r.height * scale);
  const x = Math.round(r.x * scale);
  const y = Math.round(r.y * scale);
  return `${w}x${h}@${x},${y}`;
}

interface PixelRect {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

function scaleRect(r: Rect, scale: number): PixelRect {
  return {
    x: Math.round(r.x * scale),
    y: Math.round(r.y * scale),
    x2: Math.round((r.x + r.width) * scale),
    y2: Math.round((r.y + r.height) * scale),
  };
}

// Blacks out everything outside the tray + window rects (scaled from DIPs
// to physical pixels). Drops OS chrome, wallpaper, clocks, dock icons —
// only marker content survives so diffs reflect real rendering changes.
function maskToRects(src: PNG, b: Bounds): PNG {
  const scale = b.scale || 1;
  const keep = [b.tray, b.window]
    .filter((r) => r.width > 0 && r.height > 0)
    .map((r) => ({
      x: Math.max(0, Math.round(r.x * scale) - RECT_PADDING),
      y: Math.max(0, Math.round(r.y * scale) - RECT_PADDING),
      x2: Math.min(
        src.width,
        Math.round((r.x + r.width) * scale) + RECT_PADDING,
      ),
      y2: Math.min(
        src.height,
        Math.round((r.y + r.height) * scale) + RECT_PADDING,
      ),
    }));
  const out = new PNG({ width: src.width, height: src.height });
  for (let i = 0; i < out.data.length; i += 4) {
    out.data[i] = 0;
    out.data[i + 1] = 0;
    out.data[i + 2] = 0;
    out.data[i + 3] = 255;
  }
  for (const r of keep) {
    for (let y = r.y; y < r.y2; y++) {
      for (let x = r.x; x < r.x2; x++) {
        const i = (y * src.width + x) * 4;
        out.data[i] = src.data[i];
        out.data[i + 1] = src.data[i + 1];
        out.data[i + 2] = src.data[i + 2];
        out.data[i + 3] = 255;
      }
    }
  }
  return out;
}
