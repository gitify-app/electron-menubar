import { isAbsolute, relative, resolve, sep } from 'node:path';

/**
 * Resolve a CLI-provided path relative to the working directory and refuse
 * anything that would escape it. Prevents path traversal via untrusted
 * command-line arguments (tssecurity:S8707).
 *
 * Rejects both `..` traversal and any path outside `cwd`, including a
 * different root/drive on Windows where `relative()` returns the target
 * verbatim instead of a `..`-prefixed path. Returns the resolved absolute
 * path so callers cannot re-resolve a stale relative value.
 */
export const resolveFromCwd = (
  arg: string | undefined,
  fallback: string,
): string => {
  const cwd = process.cwd();
  const resolved = resolve(cwd, arg ?? fallback);
  const rel = relative(cwd, resolved);
  if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
    console.error(
      `refusing path outside the working directory: ${arg ?? fallback}`,
    );
    process.exit(1);
  }
  return resolved;
};
