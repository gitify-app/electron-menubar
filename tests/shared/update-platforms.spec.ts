import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

const report =
  '# Platforms\n<!-- platforms:start -->\nstale E2E\n<!-- platforms:end -->\n<!-- visual:start -->\nstale visual\n<!-- visual:end -->\n';
const docs =
  '---\ntitle: Platforms\n---\n{/* platforms:start */}\nstale E2E\n{/* platforms:end */}\n{/* visual:start */}\nstale visual\n{/* visual:end */}\n';
const fixtures: string[] = [];

afterEach(() => {
  for (const directory of fixtures.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe.each([
  {
    kind: 'e2e',
    resultsDir: 'platforms',
    section: 'platforms',
    other: 'visual',
  },
  {
    kind: 'visual',
    resultsDir: 'visual',
    section: 'visual',
    other: 'platforms',
  },
])('$kind platform automation', ({ kind, resultsDir, section, other }) => {
  const setup = () => {
    const directory = mkdtempSync(join(tmpdir(), 'menubar-platforms-'));
    fixtures.push(directory);
    mkdirSync(join(directory, 'docs/platforms'), { recursive: true });
    mkdirSync(join(directory, 'test-results', resultsDir), { recursive: true });
    writeFileSync(join(directory, 'PLATFORMS.md'), report);
    writeFileSync(
      join(directory, 'docs/platforms/supported-platforms.mdx'),
      docs,
    );
    for (const result of [
      {
        key: 'ubuntu-24.04',
        label: 'Ubuntu 24.04 (Noble Numbat)',
        status: 'fail',
      },
      { key: 'macos-27', label: 'macOS 27 (Golden Gate)', status: 'pass' },
    ]) {
      writeFileSync(
        join(directory, 'test-results', resultsDir, `${result.key}.json`),
        JSON.stringify({ ...result, date: '2026-11-06T00:00:00.000Z' }),
      );
    }
    return {
      run: () =>
        spawnSync(
          process.execPath,
          [resolve(`tests/${kind}/update-platforms.mts`)],
          { cwd: directory, encoding: 'utf8' },
        ),
      readReport: () => readFileSync(join(directory, 'PLATFORMS.md'), 'utf8'),
      readDocs: () =>
        readFileSync(
          join(directory, 'docs/platforms/supported-platforms.mdx'),
          'utf8',
        ),
      writeDocs: (value: string) =>
        writeFileSync(
          join(directory, 'docs/platforms/supported-platforms.mdx'),
          value,
        ),
    };
  };

  it('updates both reports, preserves the other section, and is idempotent', () => {
    const fixture = setup();
    expect(fixture.run().status).toBe(0);
    const updatedReport = fixture.readReport();
    const updatedDocs = fixture.readDocs();
    for (const text of [updatedReport, updatedDocs]) {
      expect(text).toContain('| macOS 27 (Golden Gate) | ✅ Pass |');
      expect(text).toContain('| Ubuntu 24.04 (Noble Numbat) | ❌ Fail |');
      expect(text.indexOf('macOS 27')).toBeLessThan(
        text.indexOf('Ubuntu 24.04'),
      );
    }
    const untouched = other === 'visual' ? 'stale visual' : 'stale E2E';
    expect(updatedReport).toContain(untouched);
    expect(updatedDocs).toContain(untouched);
    expect(updatedDocs).toContain('title: Platforms');
    expect(updatedDocs).toContain(`{/* ${section}:start */}`);
    if (kind === 'visual') {
      expect(updatedDocs).toContain(
        '<Accordion title="macOS 27 (Golden Gate)">',
      );
      expect(updatedDocs).toContain(
        'https://raw.githubusercontent.com/gitify-app/electron-menubar/main/.github/visual-screenshots/macos-27.png',
      );
    }
    expect(fixture.run().status).toBe(0);
    expect(fixture.readReport()).toBe(updatedReport);
    expect(fixture.readDocs()).toBe(updatedDocs);
    fixture.writeDocs(docs);
    expect(fixture.run().status).toBe(0);
    expect(fixture.readReport()).toBe(updatedReport);
    expect(fixture.readDocs()).toBe(updatedDocs);
  });

  it('fails before modifying the report when docs markers are missing', () => {
    const fixture = setup();
    fixture.writeDocs('Missing markers');
    expect(fixture.run().status).not.toBe(0);
    expect(fixture.readReport()).toBe(report);
    expect(fixture.readDocs()).toBe('Missing markers');
  });
});
