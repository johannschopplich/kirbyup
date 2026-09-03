import type { CliHarness, FileMap } from 'utilful/cli/testing'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { createCliHarness, useTemporaryDirectories } from 'utilful/cli/testing'
import { mainCommand } from '../src/node/cli.ts'

export { useTemporaryDirectories } from 'utilful/cli/testing'

const harness = createCliHarness(mainCommand, {
  // The published entry point, so a run covers `bin` and `dist` as a user gets them.
  entry: path.join(import.meta.dirname, '../bin/kirbyup.mjs'),
})

export const runCli: CliHarness['runCli'] = harness.runCli
export const runCliProcess: CliHarness['runCliProcess'] = harness.runCliProcess

export interface BuildFixtureResult {
  output: string
  getFileContent: (filename: string) => Promise<string>
}

/**
 * Returns a factory that writes a plugin source tree, builds it, and hands back
 * what landed on disk – the shape most of kirbyup's tests assert against. Call
 * it at the top level of a test file, like `useTemporaryDirectories`.
 */
export function useBuildFixtures(): (files: FileMap) => Promise<BuildFixtureResult> {
  const createDirectory = useTemporaryDirectories()

  return async (files: FileMap) => {
    // Vite reads the name from the nearest `package.json` when it has to name
    // the CSS bundle, so a fixture without one is not a plugin folder Vite can
    // build – the same failure a real plugin without a manifest would hit.
    const directory = createDirectory({
      'package.json': '{ "name": "kirbyup-fixture", "type": "module" }',
      ...files,
    })

    const getFileContent = async (filename: string) =>
      normalizeOutput(await fsp.readFile(path.resolve(directory, filename), 'utf8'))

    await runCli(['src/input.js'], { cwd: directory })

    return { output: await getFileContent('index.js'), getFileContent }
  }
}

/** Removes Rolldown's region markers, which carry the per-run tmpdir path. */
function normalizeOutput(source: string): string {
  return source
    .replace(/\/\/#region [^\n]*\n/g, '')
    .replace(/\/\/#endregion\n?/g, '')
}
