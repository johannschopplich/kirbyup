import type { ChildProcess } from 'node:child_process'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as fsp from 'node:fs/promises'
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

describe('watch builds', () => {
  const CSS_PLUGIN: Record<string, string> = {
    ...PLUGIN,
    'index.css': '.shipped{}',
    'src/input.js': 'import \'./input.css\'',
    'src/input.css': '.live { color: red; }',
  }

  it('writes imported CSS to index.dev.css, leaving index.css untouched', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const watcher = startWatchBuild(directory)

    try {
      await waitForFile(path.join(directory, 'index.dev.css'), true)
      expect(await fsp.readFile(path.join(directory, 'index.css'), 'utf8')).toBe('.shipped{}')
    }
    finally {
      await stopProcess(watcher)
    }
  })

  it('removes index.dev.js and index.dev.css on SIGINT', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const watcher = startWatchBuild(directory)
    await waitForWatching(watcher)
    await stopProcess(watcher)

    expect(existsSync(path.join(directory, 'index.dev.js'))).toBe(false)
    expect(existsSync(path.join(directory, 'index.dev.css'))).toBe(false)
  })

  it('removes index.dev.css once the entry stops importing CSS', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const watcher = startWatchBuild(directory)

    try {
      await waitForWatching(watcher)
      await fsp.writeFile(path.join(directory, 'src/input.js'), PLUGIN['src/input.js']!)
      await waitForFile(path.join(directory, 'index.dev.css'), false)
    }
    finally {
      await stopProcess(watcher)
    }
  })

  it('ignores its own output when --watch-path covers the plugin root', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const watcher = startWatchBuild(directory, ['--watch-path', '.'])

    try {
      await waitForWatching(watcher)
      await new Promise(resolve => setTimeout(resolve, 500))
      expect(watcher.log).not.toMatch(/ (?:add|change)$/m)
    }
    finally {
      await stopProcess(watcher)
    }
  })
})

interface WatchProcess extends ChildProcess {
  log: string
}

function startWatchBuild(cwd: string, args: string[] = ['--watch']): WatchProcess {
  const child = spawn(process.execPath, [path.join(import.meta.dirname, '../bin/kirbyup.mjs'), 'src/input.js', ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_COLOR: '1' },
  }) as WatchProcess
  child.log = ''
  child.stdout!.on('data', chunk => child.log += chunk)
  child.stderr!.on('data', chunk => child.log += chunk)
  return child
}

/**
 * Settles once kirbyup has printed the watched paths, which it does right
 * before it installs its exit handlers and starts the watcher.
 */
async function waitForWatching(child: WatchProcess): Promise<void> {
  await waitFor(() => child.log.includes('Watching'), 'the watch build to start')
  // chokidar reports no readiness to the child's output, so its initial scan
  // gets a moment before a test edits a watched file.
  await new Promise(resolve => setTimeout(resolve, 200))
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null)
    return
  const exited = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGINT')
  await exited
}

async function waitForFile(filePath: string, shouldExist: boolean): Promise<void> {
  await waitFor(() => existsSync(filePath) === shouldExist, `${filePath} to ${shouldExist ? 'appear' : 'disappear'}`)
}

async function waitFor(condition: () => boolean, description: string): Promise<void> {
  const deadline = Date.now() + 4_000
  while (!condition()) {
    if (Date.now() > deadline)
      throw new Error(`Timed out waiting for ${description}`)
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}
