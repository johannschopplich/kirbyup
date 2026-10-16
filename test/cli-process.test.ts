import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as fsp from 'node:fs/promises'
import * as path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import packageJson from '../package.json' with { type: 'json' }
import { CLI_ENTRY_PATH, runCliProcess, useTemporaryDirectories } from './utils.ts'

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

describe('watch builds', () => {
  const CSS_PLUGIN: Record<string, string> = {
    ...PLUGIN,
    'src/input.js': 'import \'./input.css\'',
    'src/input.css': '.live { color: red; }',
  }

  it('writes imported CSS to index.dev.css until SIGINT, leaving index.css untouched', async () => {
    const directory = createDirectory({ ...CSS_PLUGIN, 'index.css': '.shipped{}' })
    const watchBuild = startWatchBuild(directory)

    try {
      await vi.waitFor(() => expect(existsSync(path.join(directory, 'index.dev.css'))).toBe(true), { timeout: 4_000 })
      expect(await fsp.readFile(path.join(directory, 'index.css'), 'utf8')).toBe('.shipped{}')
      // kirbyup installs its SIGINT handler right after printing the watched paths.
      await vi.waitFor(() => expect(watchBuild.getOutput()).toContain('Watching'), { timeout: 4_000 })
    }
    finally {
      await stopProcess(watchBuild.child)
    }

    expect(existsSync(path.join(directory, 'index.dev.css'))).toBe(false)
  })

  it('removes index.dev.css once the entry stops importing CSS', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const devStylesheetPath = path.join(directory, 'index.dev.css')
    const watchBuild = startWatchBuild(directory)

    try {
      await vi.waitFor(() => expect(existsSync(devStylesheetPath)).toBe(true), { timeout: 4_000 })
      // Rewritten on every retry, since chokidar may still be scanning.
      await vi.waitFor(async () => {
        await fsp.writeFile(path.join(directory, 'src/input.js'), PLUGIN['src/input.js']!)
        expect(existsSync(devStylesheetPath)).toBe(false)
      }, { timeout: 4_000, interval: 300 })
    }
    finally {
      await stopProcess(watchBuild.child)
    }
  })

  it('ignores its own output when --watch-path covers the plugin root', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const watchBuild = startWatchBuild(directory, ['--watch-path', '.'])

    try {
      await vi.waitFor(() => expect(watchBuild.getOutput()).toContain('Watching'), { timeout: 4_000 })
      await new Promise(resolve => setTimeout(resolve, 500))
      expect(watchBuild.getOutput()).not.toMatch(/ (?:add|change)$/m)
    }
    finally {
      await stopProcess(watchBuild.child)
    }
  })
})

function startWatchBuild(cwd: string, args: string[] = ['--watch']): { child: ChildProcess, getOutput: () => string } {
  const child = spawn(process.execPath, [CLI_ENTRY_PATH, 'src/input.js', ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_COLOR: '1' },
  })
  let output = ''
  child.stdout!.on('data', chunk => output += chunk)
  child.stderr!.on('data', chunk => output += chunk)
  return { child, getOutput: () => output }
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null)
    return
  const exitPromise = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGINT')
  await exitPromise
}
