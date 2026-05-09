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
  lint: {
    ignorePatterns: ['lib/**', 'docs/**', 'examples/**', 'coverage/**'],
  },
  fmt: {
    singleQuote: true,
    tabWidth: 2,
    printWidth: 80,
    sortImports: true,
    ignorePatterns: [
      'lib/**',
      'docs/**',
      'examples/**',
      'coverage/**',
      'CHANGELOG.md',
      '**/*.md',
      '.github/**',
    ],
  },
});
