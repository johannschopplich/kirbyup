import { resolve } from 'pathe'
import { outputFile, readFile } from 'fs-extra'
import fg from 'fast-glob'
import { startCli } from '../src/node/cli-start'

export const cacheDir = resolve(__dirname, '.cache')
export const cli = resolve(__dirname, '../src/node/cli.ts')

export async function runCli(files: Record<string, string>) {
  const testDir = resolve(cacheDir, Date.now().toString())

  // Retrieve any file's content
  const getFileContent = (filename: string) =>
    readFile(resolve(testDir, filename), 'utf8')

  // Write entry files on disk
  await Promise.all(
    Object.entries(files).map(([path, content]) =>
      outputFile(resolve(testDir, path), content, 'utf8'),
    ),
  )

  await runAsyncChildProcess(testDir, 'src/input.js')

  // Get main output and all associated files
  const output = await getFileContent('index.js')
  const outFiles = await fg('**/*', { cwd: testDir, ignore: ['src'] })

  return {
    output,
    outFiles,
    getFileContent,
  }
}

function runAsyncChildProcess(cwd: string, ...args: string[]) {
  return startCli(cwd, ['', '', ...args])
}
