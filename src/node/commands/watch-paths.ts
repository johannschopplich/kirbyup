import { CliError } from '../errors.ts'

const GLOB_CHARACTERS = /[*?[\]{}]/

/**
 * Splits a comma-separated `--watch-path` value.
 *
 * `build` hands its paths to chokidar, which has expanded no globs since v4, so
 * a pattern there would watch nothing at all – it is rejected rather than
 * silently ignored. `serve` matches through Vite's own watcher, where globs work.
 */
export function resolveWatchPaths(
  value: string | undefined,
  { allowGlobs }: { allowGlobs: boolean },
): string[] {
  const paths = (value ?? '')
    .split(',')
    .map(path => path.trim())
    .filter(path => path !== '')

  if (!allowGlobs) {
    const pattern = paths.find(path => GLOB_CHARACTERS.test(path))

    if (pattern !== undefined) {
      throw new CliError(
        `--watch-path takes files and folders, not patterns: ${pattern}\n`
        + 'Name the folder instead – it is watched recursively.',
      )
    }
  }

  return paths
}
