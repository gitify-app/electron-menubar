#!/usr/bin/env node
import {
  type PlatformResult,
  updatePlatforms,
} from '../shared/update-platforms.mts';

const START = '<!-- visual:start -->';
const END = '<!-- visual:end -->';

const screenshotCell = (key: string): string =>
  `<details><summary>view</summary><img src=".github/visual-screenshots/${key}.png" width="600" alt="${key} screenshot"></details>`;

// Fixed inputs only; see tests/shared/update-platforms.mts for why paths are not
// derived from `argv` (tssecurity:S8707).
updatePlatforms<PlatformResult>({
  resultsDir: 'test-results/visual',
  start: START,
  end: END,
  buildBlock: (results) => {
    const rows = results
      .map(
        (r) =>
          `| ${r.label} | ${r.status === 'pass' ? '✅ Pass' : '❌ Fail'} | ${screenshotCell(r.key)} |`,
      )
      .join('\n');

    return [
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
  },
});
