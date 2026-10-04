import { relative, resolve } from 'node:path';

/**
 * Resolve a CLI-provided path relative to the working directory and refuse
 * anything that would escape it. Prevents path traversal via untrusted
 * command-line arguments (tssecurity:S8707).
 */
export const resolveFromCwd = (
  arg: string | undefined,
  fallback: string,
): string => {
  const target = arg ?? fallback;
  const cwd = process.cwd();
  if (relative(cwd, resolve(cwd, target)).startsWith('..')) {
    console.error(`refusing path outside the working directory: ${target}`);
    process.exit(1);
  }
  return target;
};
