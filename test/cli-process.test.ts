import type { ChildProcess } from 'node:child_process'
import type { AddressInfo, Server } from 'node:net'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as fsp from 'node:fs/promises'
import { createServer } from 'node:net'
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
      await rewriteUntil(path.join(directory, 'src/input.js'), PLUGIN['src/input.js']!, () => {
        expect(existsSync(devStylesheetPath)).toBe(false)
      })
    }
    finally {
      await stopProcess(watchBuild.child)
    }
  })

  it('ignores index.dev.css and node_modules with --watch-path .', async () => {
    const directory = createDirectory(CSS_PLUGIN)
    const watchBuild = startWatchBuild(directory, ['--watch-path', '.'])

    try {
      await editStylesheetUntilRebuilt(directory)
      await fsp.mkdir(path.join(directory, 'node_modules'))
      await fsp.writeFile(path.join(directory, 'node_modules/foo.js'), '')
      await new Promise(resolve => setTimeout(resolve, 500))

      const changedFiles = [...watchBuild.getOutput().matchAll(/(\S+) (?:add|change)$/gm)].map(match => match[1]!)
      expect(changedFiles.filter(file => !/^src[/\\]/.test(file))).toEqual([])
    }
    finally {
      await stopProcess(watchBuild.child)
    }
  })

  it('rebuilds a plugin below a node_modules folder', async () => {
    const root = createDirectory(Object.fromEntries(
      Object.entries(CSS_PLUGIN).map(([file, content]) => [`node_modules/plugin/${file}`, content]),
    ))
    const directory = path.join(root, 'node_modules/plugin')
    const watchBuild = startWatchBuild(directory)

    try {
      await editStylesheetUntilRebuilt(directory)
    }
    finally {
      await stopProcess(watchBuild.child)
    }
  })
})

describe('dev server', () => {
  it('exits with a failure status when the --port is taken', async () => {
    const blocker = await occupyFreePort()
    const devServer = startCli(createDirectory(PLUGIN), ['dev', 'src/input.js', '--port', String((blocker.address() as AddressInfo).port)])

    try {
      await vi.waitFor(() => expect(devServer.child.exitCode).toBe(1), { timeout: 4_000 })
      expect.soft(devServer.getOutput()).toContain('is already in use')
      expect.soft(devServer.getOutput()).not.toMatch(/^\s+at /m)
    }
    finally {
      await stopProcess(devServer.child)
      await new Promise(resolve => blocker.close(resolve))
    }
  })

  it('reloads the Panel for a file in a --watch-path folder', async () => {
    const directory = createDirectory({ ...PLUGIN, 'snippets/card.php': '' })
    const devServer = await startDevServer(directory, ['--watch-path', 'snippets'])

    try {
      await rewriteUntil(path.join(directory, 'snippets/card.php'), '<?php', () => {
        expect(devServer.getOutput()).toContain('snippets/card.php changed')
      })
    }
    finally {
      await stopProcess(devServer.child)
    }
  })

  it('reloads the Panel for a --watch-path file outside the working directory', async () => {
    const root = createDirectory({
      'outside.php': '',
      ...Object.fromEntries(Object.entries(PLUGIN).map(([file, content]) => [`plugin/${file}`, content])),
    })
    const devServer = await startDevServer(path.join(root, 'plugin'), ['--watch-path', '../outside.php'])

    try {
      await rewriteUntil(path.join(root, 'outside.php'), '<?php', () => {
        expect(devServer.getOutput()).toContain('../outside.php changed')
      })
    }
    finally {
      await stopProcess(devServer.child)
    }
  })
})

function startWatchBuild(cwd: string, args: string[] = ['--watch']): { child: ChildProcess, getOutput: () => string } {
  return startCli(cwd, ['src/input.js', ...args])
}

async function startDevServer(cwd: string, args: string[]): Promise<{ child: ChildProcess, getOutput: () => string }> {
  return startCli(cwd, ['dev', 'src/input.js', '--port', String(await findFreePort()), ...args])
}

function startCli(cwd: string, args: string[]): { child: ChildProcess, getOutput: () => string } {
  const child = spawn(process.execPath, [CLI_ENTRY_PATH, ...args], {
    cwd,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NO_COLOR: '1' },
  })
  let output = ''
  child.stdout!.on('data', chunk => output += chunk)
  child.stderr!.on('data', chunk => output += chunk)
  return { child, getOutput: () => output }
}

async function editStylesheetUntilRebuilt(directory: string): Promise<void> {
  await rewriteUntil(path.join(directory, 'src/input.css'), '.edited {}', async () => {
    expect(await fsp.readFile(path.join(directory, 'index.dev.css'), 'utf8')).toContain('.edited')
  })
}

/** Rewrites `filePath` on every retry until `assertion` passes, since chokidar may still be scanning. */
async function rewriteUntil(filePath: string, content: string, assertion: () => void | Promise<void>): Promise<void> {
  await vi.waitFor(async () => {
    await fsp.writeFile(filePath, content)
    await assertion()
  }, { timeout: 4_000, interval: 300 })
}

async function occupyFreePort(): Promise<Server> {
  const server = createServer()
  await new Promise<void>(resolve => server.listen(0, 'localhost', resolve))
  return server
}

async function findFreePort(): Promise<number> {
  const server = await occupyFreePort()
  const { port } = server.address() as AddressInfo
  await new Promise(resolve => server.close(resolve))
  return port
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null)
    return
  const exitPromise = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGINT')
  await exitPromise
}
