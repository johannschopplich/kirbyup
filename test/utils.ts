import { resolve } from 'pathe'
import fs from 'fs-extra'
import fg from 'fast-glob'
import { execa } from 'execa'

export const cacheDir = resolve(__dirname, '.cache')
export const cli = resolve(__dirname, '../src/node/cli.ts')

export async function runCli(files: Record<string, string>) {
  const testDir = resolve(cacheDir, Date.now().toString())

  // Retrieve any file's content
  const getFileContent = (filename: string) =>
    fs.readFile(resolve(testDir, filename), 'utf8')

  // Write entry files on disk
  await Promise.all(
    Object.entries(files).map(([path, content]) =>
      fs.outputFile(
        resolve(testDir, path),
        content.replace(/\{(.+?)\}\?raw/, '$1'),
        'utf8'
      )
    )
  )

  // Run kirbyup cli
  const { exitCode, stdout, stderr } = await execa(
    'npx',
    ['tsx', cli, 'src/input.js'],
    { cwd: testDir }
  )

  const logs = stdout + stderr
  if (exitCode !== 0) {
    throw new Error(logs)
  }

  // Get main output and all associated files
  const output = await getFileContent('index.js')
  const outFiles = await fg('**/*', { cwd: testDir, ignore: ['src'] })

  return {
    output,
    outFiles,
    logs,
    getFileContent
  }
}
