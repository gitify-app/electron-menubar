#!/usr/bin/env node
import {
  type PlatformResult as BasePlatformResult,
  updatePlatforms,
} from '../shared/update-platforms.mts';

interface PlatformResult extends BasePlatformResult {
  runUrl: string | null;
  sha: string | null;
}

const START = '<!-- platforms:start -->';
const END = '<!-- platforms:end -->';

// Fixed inputs only; see tests/shared/update-platforms.mts for why paths are not
// derived from `argv` (tssecurity:S8707).
updatePlatforms<PlatformResult>({
  resultsDir: 'test-results/platforms',
  start: START,
  end: END,
  buildBlock: (results) => {
    const rows = results
      .map(
        (r) =>
          `| ${r.label} | ${r.status === 'pass' ? '✅ Pass' : '❌ Fail'} |`,
      )
      .join('\n');

    return [
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
  },
});
