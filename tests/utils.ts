import { resolve } from 'path'
import fs from 'fs-extra'
import fg from 'fast-glob'
import execa from 'execa'

export const cacheDir = resolve(__dirname, '.cache')
export const bin = resolve(__dirname, '../dist/cli.js')

// https://stackoverflow.com/questions/52788380/get-the-current-test-spec-name-in-jest
export const getTestName = () => expect.getState().currentTestName

export async function run(files: Record<string, string>) {
  const testDir = resolve(cacheDir, getTestName())

  // Write entry files on disk
  await Promise.all(
    Object.entries(files).map(([path, content]) =>
      fs.outputFile(resolve(testDir, path), content, 'utf8')
    )
  )

  // Run kirbyup cli
  const { exitCode, stdout, stderr } = await execa(bin, ['src/input.js'], {
    cwd: testDir
  })

  const logs = stdout + stderr
  if (exitCode !== 0) {
    throw new Error(logs)
  }

  // Get main output and all associated files
  const output = await fs.readFile(resolve(testDir, 'index.js'), 'utf8')
  const outFiles = await fg('**/*', { cwd: testDir, ignore: ['src'] })

  return {
    output,
    outFiles,
    logs,
    getFileContent(filename: string) {
      return fs.readFile(resolve(testDir, filename), 'utf8')
    }
  }
}
