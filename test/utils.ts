import * as fsp from 'node:fs/promises'
import { dirname } from 'node:path'
import fg from 'fast-glob'
import { resolve } from 'pathe'
import { startCli } from '../src/node/cli-start'

export const cacheDir = new URL('./.cache', import.meta.url).pathname
export const cli = new URL('../src/node/cli.ts', import.meta.url).pathname

export async function runCli(files: Record<string, string>) {
  const testDir = resolve(cacheDir, Date.now().toString())

  // Retrieve any file's content
  const getFileContent = (filename: string) =>
    fsp.readFile(resolve(testDir, filename), 'utf8')

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
