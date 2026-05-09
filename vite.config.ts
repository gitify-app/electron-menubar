import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    platform: 'node',
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: 'lib',
  },
  test: {
    include: ['src/**/*.spec.ts'],
  },
});
