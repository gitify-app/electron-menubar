import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface PlatformResult {
  key: string;
  label: string;
  status: 'pass' | 'fail';
  date: string;
}

export interface UpdatePlatformsOptions<T extends PlatformResult> {
  resultsDir: string;
  start: string;
  end: string;
  buildBlock: (results: T[]) => string;
}

const TARGET_PATH = 'PLATFORMS.md';

// Fixed inputs only. The workflows invoke these scripts with no arguments, so
// deriving filesystem paths from `argv` was an unused taint source Sonar
// reported as path traversal (tssecurity:S8707). Callers pass literal paths.
const readResults = <T extends PlatformResult>(resultsDir: string): T[] => {
  const files = readdirSync(resultsDir).filter((f) => f.endsWith('.json'));
  const results = files
    .map((f) => JSON.parse(readFileSync(join(resultsDir, f), 'utf8')) as T)
    .sort((a, b) => a.label.localeCompare(b.label));

  if (results.length === 0) {
    console.error('no result files found in', resultsDir);
    process.exit(1);
  }

  return results;
};

export const updatePlatforms = <T extends PlatformResult>({
  resultsDir,
  start,
  end,
  buildBlock,
}: UpdatePlatformsOptions<T>): void => {
  const results = readResults<T>(resultsDir);
  const block = buildBlock(results);

  const original = readFileSync(TARGET_PATH, 'utf8');
  const startIdx = original.indexOf(start);
  const endIdx = original.indexOf(end);

  if (startIdx === -1 || endIdx === -1) {
    console.error(`markers ${start} / ${end} not found in ${TARGET_PATH}`);
    process.exit(1);
  }

  const updated =
    original.slice(0, startIdx) + block + original.slice(endIdx + end.length);

  if (updated === original) {
    console.log(`${TARGET_PATH} unchanged`);
    process.exit(0);
  }

  writeFileSync(TARGET_PATH, updated);
  console.log(`${TARGET_PATH} updated with ${results.length} platform(s)`);
};
