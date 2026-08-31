import * as fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { startCli } from '../src/node/cli-start'

export interface CliRunResult {
  output: string
  getFileContent: (filename: string) => Promise<string>
}

export async function runCli(files: Record<string, string>): Promise<CliRunResult> {
  const testDir = await fsp.mkdtemp(join(tmpdir(), 'kirbyup-'))

  const getFileContent = async (filename: string) =>
    normalizeOutput(await fsp.readFile(resolve(testDir, filename), 'utf8'))

  await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const filePath = resolve(testDir, path)
      await fsp.mkdir(dirname(filePath), { recursive: true })
      await fsp.writeFile(filePath, content, 'utf8')
    }),
  )

  // cac expects argv padded with [node, script] slots before user args.
  await startCli(testDir, ['', '', 'src/input.js'])

  const output = await getFileContent('index.js')

  return { output, getFileContent }
}

/** Removes Rolldown's region markers, which carry the per-run tmpdir path. */
function normalizeOutput(source: string) {
  return source
    .replace(/\/\/#region [^\n]*\n/g, '')
    .replace(/\/\/#endregion\n?/g, '')
}
