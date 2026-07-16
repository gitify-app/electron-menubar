import { rmSync } from 'node:fs';

import { defineConfig } from 'rolldown';
import { dts } from 'rolldown-plugin-dts';

// electron is a peer dependency and must never be bundled.
const external = ['electron'];

// rolldown has no built-in clean; wipe the output dir once before every build.
rmSync('lib', { recursive: true, force: true });

const shared = {
  input: 'src/index.ts',
  platform: 'node',
  external,
} as const;

export default defineConfig([
  // ESM: lib/index.mjs (+ map) and its types lib/index.d.mts
  {
    ...shared,
    plugins: [dts()],
    output: {
      dir: 'lib',
      format: 'es',
      entryFileNames: '[name].mjs',
      sourcemap: true,
    },
  },
  // CJS: lib/index.cjs (+ map)
  {
    ...shared,
    output: {
      dir: 'lib',
      format: 'cjs',
      entryFileNames: '[name].cjs',
      sourcemap: true,
    },
  },
  // CJS types: lib/index.d.cts. The dts plugin refuses a cjs-format output, so
  // emit types-only from an es build whose .cjs entry name yields a .d.cts file.
  {
    ...shared,
    plugins: [dts({ emitDtsOnly: true })],
    output: {
      dir: 'lib',
      format: 'es',
      entryFileNames: '[name].cjs',
    },
  },
]);
