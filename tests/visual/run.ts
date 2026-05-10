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
const PASS_THRESHOLD = 50;

const child = spawn(electronBin, [fixturePath], {
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, ELECTRON_DISABLE_SANDBOX: '1' },
});

let ready = false;
child.stdout.on('data', (chunk: Buffer) => {
  const s = chunk.toString();
  process.stdout.write(s);
  if (s.includes('VISUAL:ready')) ready = true;
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
let magenta = 0;
let green = 0;
for (let i = 0; i < png.data.length; i += 4) {
  const r = png.data[i];
  const g = png.data[i + 1];
  const b = png.data[i + 2];
  if (r > 200 && g < 80 && b > 200) magenta++;
  else if (r < 80 && g > 200 && b < 80) green++;
}

const total = magenta + green;
const status: 'pass' | 'fail' = total >= PASS_THRESHOLD ? 'pass' : 'fail';
console.log(
  `magenta=${magenta} green=${green} total=${total} threshold=${PASS_THRESHOLD} → ${status}`,
);
writeResult({ status, magenta, green, total });

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
