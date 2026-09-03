import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

/**
 * Builds before the suite runs. `runCliProcess` drives `bin/kirbyup.mjs`, which
 * loads `dist` – the seam an in-process run never touches. Building from the
 * source instead is not an option: the HMR runtime arrives through a `?raw`
 * import that only a bundler resolves.
 */
export async function setup(): Promise<void> {
  await execFileAsync('npx', ['tsdown'], { cwd: import.meta.dirname.replace(/\/test$/, '') })
}
