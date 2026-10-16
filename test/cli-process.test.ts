import { existsSync } from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import { runCliProcess, useTemporaryDirectories } from './utils.ts'

const PLUGIN: Record<string, string> = {
  'package.json': '{ "name": "kirbyup-fixture", "type": "module" }',
  'src/input.js': 'window.panel.plugin(\'kirbyup/test\', {})',
}

const createDirectory = useTemporaryDirectories()

describe('kirbyup CLI as a child process', () => {
  it('prints its version to stdout', async () => {
    const { stdout, exitCode } = await runCliProcess(['--version'])

    expect(stdout).toBe(`${packageJson.version}\n`)
    expect(exitCode).toBe(0)
  })

  it('prints requested help to stdout, naming every command', async () => {
    const { stdout, exitCode } = await runCliProcess(['--help'])

    expect(stdout).toContain('build')
    expect(stdout).toContain('dev')
    expect(stdout).toContain('serve')
    expect(exitCode).toBe(0)
  })

  it('keeps usage off stdout when an argument was wrong', async () => {
    const { stdout, stderr, exitCode } = await runCliProcess(['build'])

    expect(stdout).toBe('')
    expect(stderr).toContain('USAGE')
    expect(stderr).toContain('Missing required positional argument')
    expect(exitCode).toBe(1)
  })

  it('builds an entry named without the build command', async () => {
    const directory = createDirectory(PLUGIN)
    const { stderr, exitCode } = await runCliProcess(['src/input.js'], { cwd: directory })

    expect(exitCode).toBe(0)
    expect(existsSync(path.join(directory, 'index.js'))).toBe(true)
    expect(stderr).toContain('kirbyup')
    expect(stderr).toContain('index.js')
  })

  it('builds an entry named after the build command', async () => {
    const directory = createDirectory(PLUGIN)
    const { exitCode } = await runCliProcess(['build', 'src/input.js'], { cwd: directory })

    expect(exitCode).toBe(0)
    expect(existsSync(path.join(directory, 'index.js'))).toBe(true)
  })

  it('honours --out-dir even when its value spells a command name', async () => {
    const directory = createDirectory(PLUGIN)
    const { exitCode } = await runCliProcess(['--out-dir', 'build', 'src/input.js'], { cwd: directory })

    expect(exitCode).toBe(0)
    expect(existsSync(path.join(directory, 'build/index.js'))).toBe(true)
    expect(existsSync(path.join(directory, 'index.js'))).toBe(false)
  })

  it('honours an inline short option value', async () => {
    const directory = createDirectory(PLUGIN)
    const { exitCode } = await runCliProcess(['src/input.js', '-d=out'], { cwd: directory })

    expect(exitCode).toBe(0)
    expect(existsSync(path.join(directory, 'out/index.js'))).toBe(true)
    expect(existsSync(path.join(directory, '=out'))).toBe(false)
  })

  it('refuses a watch pattern chokidar would not expand', async () => {
    const { stderr, exitCode } = await runCliProcess(
      ['src/input.js', '--watch-path', 'src/**/*.js'],
      { cwd: createDirectory(PLUGIN) },
    )

    expect(stderr).toContain('not patterns')
    expect(exitCode).toBe(1)
  })

  it('exits with a failure status for a missing entry', async () => {
    const { stdout, stderr, exitCode } = await runCliProcess(['src/missing.js'], {
      cwd: createDirectory(PLUGIN),
    })

    expect(stdout).toBe('')
    expect(stderr).toContain('src/missing.js')
    expect(exitCode).toBe(1)
  })

  it('rejects a flag no command declares', async () => {
    const { stderr, exitCode } = await runCliProcess(['src/input.js', '--wtach', 'src'], {
      cwd: createDirectory(PLUGIN),
    })

    expect(stderr).toContain('Unknown option \'--wtach\'')
    expect(exitCode).toBe(1)
  })
})
