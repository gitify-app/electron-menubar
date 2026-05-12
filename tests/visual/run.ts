#!/usr/bin/env bun
import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { PNG } from 'pngjs';

const electronBin: string = require('electron');
const fixturePath = join(__dirname, 'fixture', 'main.js');

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
const TRAY_EXACT_THRESHOLD = 50;
const TRAY_SATURATED_FALLBACK = 100;
// Fixture window is 200x100 = 20000 cyan+yellow pixels when fully visible.
// 2000 tolerates up to ~90% occlusion while rejecting pixel noise from
// stray app windows (windows-2022 was passing on 81 noise pixels from
// background JSON text before this was tightened).
const WINDOW_EXACT_THRESHOLD = 2000;
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

child.kill('SIGTERM');

const png = PNG.sync.read(readFileSync(screenshotPath));

// Tray icon: magenta/green checker. Some panels (notably Plasma) recolor
// tray icons, so we also count "saturated but not window-colored" pixels
// as a tray-detection fallback.
// Window content: cyan/yellow split. HTML rendering is not platform-recolored,
// so an exact match is sufficient.
let exactTray = 0;
let exactWindow = 0;
let saturatedNonWindow = 0;
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  const isMagenta = r > 200 && g < 80 && b > 200;
  const isGreen = r < 80 && g > 200 && b < 80;
  const isCyan = r < 80 && g > 200 && b > 200;
  const isYellow = r > 200 && g > 200 && b < 80;
  if (isMagenta || isGreen) exactTray++;
  if (isCyan || isYellow) exactWindow++;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max > 180 && max - min > 140 && !(isCyan || isYellow))
    saturatedNonWindow++;
}

const trayDetected =
  exactTray >= TRAY_EXACT_THRESHOLD ||
  saturatedNonWindow >= TRAY_SATURATED_FALLBACK;
const windowDetected = exactWindow >= WINDOW_EXACT_THRESHOLD;
const status: 'pass' | 'fail' =
  trayDetected && windowDetected ? 'pass' : 'fail';
console.log(
  `exactTray=${exactTray} exactWindow=${exactWindow} saturatedNonWindow=${saturatedNonWindow} → ${status} (tray=${trayDetected}, window=${windowDetected})`,
);
writeResult({
  status,
  exactTray,
  exactWindow,
  saturatedNonWindow,
  trayDetected,
  windowDetected,
});

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

const RECT_PADDING = 4;

function rectStr(r: Rect, scale: number): string {
  return `${Math.round(r.width * scale)}x${Math.round(r.height * scale)}@${Math.round(r.x * scale)},${Math.round(r.y * scale)}`;
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
      x2: Math.min(src.width, Math.round((r.x + r.width) * scale) + RECT_PADDING),
      y2: Math.min(src.height, Math.round((r.y + r.height) * scale) + RECT_PADDING),
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
