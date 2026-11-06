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
  buildDocsBlock: (results: T[]) => string;
}

const TARGET_PATH = 'PLATFORMS.md';
const DOCS_PATH = 'docs/platforms/supported-platforms.mdx';

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
  buildDocsBlock,
}: UpdatePlatformsOptions<T>): void => {
  const results = readResults<T>(resultsDir);
  const targets = [
    { path: TARGET_PATH, start, end, block: buildBlock(results) },
    {
      path: DOCS_PATH,
      start: start.replace('<!-- ', '{/* ').replace(' -->', ' */}'),
      end: end.replace('<!-- ', '{/* ').replace(' -->', ' */}'),
      block: buildDocsBlock(results),
    },
  ];

  // Validate both documents before writing either one.
  const updates = targets.map(({ path, start, end, block }) => {
    const original = readFileSync(path, 'utf8');
    const startIdx = original.indexOf(start);
    const endIdx = original.indexOf(end);

    if (startIdx === -1 || endIdx < startIdx) {
      throw new Error(
        `markers ${start} / ${end} not found or out of order in ${path}`,
      );
    }

    const updated =
      original.slice(0, startIdx) + block + original.slice(endIdx + end.length);
    return { path, original, updated };
  });

  for (const { path, original, updated } of updates) {
    if (updated === original) {
      console.log(`${path} unchanged`);
      continue;
    }
    writeFileSync(path, updated);
    console.log(`${path} updated with ${results.length} platform(s)`);
  }
};
