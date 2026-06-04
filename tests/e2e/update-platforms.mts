#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

interface PlatformResult {
  key: string;
  label: string;
  status: 'pass' | 'fail';
  runUrl: string | null;
  sha: string | null;
  date: string;
}

const START = '<!-- platforms:start -->';
const END = '<!-- platforms:end -->';

const resultsDir = process.argv[2] ?? 'test-results/platforms';
const targetPath = process.argv[3] ?? 'PLATFORMS.md';

const files = readdirSync(resultsDir).filter((f) => f.endsWith('.json'));
const results: PlatformResult[] = files
  .map(
    (f) =>
      JSON.parse(readFileSync(join(resultsDir, f), 'utf8')) as PlatformResult,
  )
  .sort((a, b) => a.label.localeCompare(b.label));

if (results.length === 0) {
  console.error('no result files found in', resultsDir);
  process.exit(1);
}

const rows = results
  .map((r) => `| ${r.label} | ${r.status === 'pass' ? '✅ Pass' : '❌ Fail'} |`)
  .join('\n');

const block = [
  START,
  '',
  '_Continuously verified by [E2E smoke tests](.github/workflows/e2e.yml)._',
  '',
  '| Platform | Status |',
  '| -------- | ------ |',
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
