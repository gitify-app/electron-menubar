#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface VisualResult {
  key: string;
  label: string;
  status: 'pass' | 'fail';
  date: string;
}

const START = '<!-- visual:start -->';
const END = '<!-- visual:end -->';

// Fixed inputs only. The workflows invoke this script with no arguments, so
// deriving filesystem paths from `argv` was an unused taint source Sonar
// reported as path traversal (tssecurity:S8707).
const resultsDir = 'test-results/visual';
const targetPath = 'PLATFORMS.md';

const files = readdirSync(resultsDir).filter((f) => f.endsWith('.json'));
const results: VisualResult[] = files
  .map(
    (f) =>
      JSON.parse(readFileSync(join(resultsDir, f), 'utf8')) as VisualResult,
  )
  .sort((a, b) => a.label.localeCompare(b.label));

if (results.length === 0) {
  console.error('no result files found in', resultsDir);
  process.exit(1);
}

const screenshotCell = (key: string): string =>
  `<details><summary>view</summary><img src=".github/visual-screenshots/${key}.png" width="600" alt="${key} screenshot"></details>`;

const rows = results
  .map(
    (r) =>
      `| ${r.label} | ${r.status === 'pass' ? '✅ Pass' : '❌ Fail'} | ${screenshotCell(r.key)} |`,
  )
  .join('\n');

const block = [
  START,
  '',
  '_Continuously verified by [visual tray rendering tests](.github/workflows/visual-tray.yml). Each run boots the menubar fixture, screenshots the OS panel, and asserts both the tray icon and the popover window are painted. These checks confirm rendering, not tray-anchored placement. See [Window positioning on Linux](#window-positioning-on-linux)._',
  '',
  '| Platform | Tray + Window | Screenshot |',
  '| -------- | ------------- | ---------- |',
  rows,
  '',
  END,
].join('\n');

const original = readFileSync(targetPath, 'utf8');
const startIdx = original.indexOf(START);
const endIdx = original.indexOf(END);

if (startIdx === -1 || endIdx === -1) {
  console.error(`markers ${START} / ${END} not found in ${targetPath}`);
  process.exit(1);
}

const updated =
  original.slice(0, startIdx) + block + original.slice(endIdx + END.length);

if (updated === original) {
  console.log(`${targetPath} unchanged`);
  process.exit(0);
}

writeFileSync(targetPath, updated);
console.log(`${targetPath} updated with ${results.length} platform(s)`);
