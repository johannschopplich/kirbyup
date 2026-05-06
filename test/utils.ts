import * as fsp from 'node:fs/promises'
import { dirname } from 'node:path'
import { resolve } from 'pathe'
import { glob } from 'tinyglobby'
import { startCli } from '../src/node/cli-start'

export const cacheDir: string = resolve(import.meta.dirname, '.cache')
export const cli: string = resolve(import.meta.dirname, '../src/node/cli.ts')

export interface CliRunResult {
  output: string
  outFiles: string[]
  getFileContent: (filename: string) => Promise<string>
}

export async function runCli(files: Record<string, string>): Promise<CliRunResult> {
  const testDir = resolve(cacheDir, Date.now().toString())

  const getFileContent = async (filename: string) =>
    stripRegionComments(await fsp.readFile(resolve(testDir, filename), 'utf8'))

  // Write entry files on disk
  await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const filePath = resolve(testDir, path)
      await fsp.mkdir(dirname(filePath), { recursive: true })
      await fsp.writeFile(filePath, content, 'utf8')
    }),
  )

  await runAsyncChildProcess(testDir, 'src/input.js')

  // Get main output and all associated files
  const output = await getFileContent('index.js')
  const outFiles = await glob('**/*', { cwd: testDir, ignore: ['src'] })

  return {
    output,
    outFiles,
    getFileContent,
  }
}

// Strip Rolldown region comments for stable snapshots
function stripRegionComments(source: string) {
  return source.replace(/\/\/#region [^\n]*\n/g, '').replace(/\/\/#endregion\n?/g, '')
}

function runAsyncChildProcess(cwd: string, ...args: string[]) {
  return startCli(cwd, ['', '', ...args])
}
