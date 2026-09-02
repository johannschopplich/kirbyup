import { parseArgs } from 'citty'
import { describe, expect, it } from 'vitest'
import { normalizeArgs } from '../src/node/cli.ts'
import { buildArgs } from '../src/node/commands/build.ts'
import { resolveWatchPaths } from '../src/node/commands/watch-paths.ts'

/** Parses like the CLI does, minus the `build` prefix `normalizeArgs` added. */
function parseBuild(argv: string[]): Record<string, unknown> {
  const rawArgs = normalizeArgs(argv)
  return parseArgs(rawArgs.slice(1), buildArgs) as Record<string, unknown>
}

describe('normalizeArgs', () => {
  it('puts build in front of a bare entry file', () => {
    expect(normalizeArgs(['src/index.js'])).toEqual(['build', 'src/index.js'])
  })

  it('leaves an explicit command alone', () => {
    for (const command of ['build', 'dev', 'serve'])
      expect(normalizeArgs([command, 'src/index.js'])[0]).toBe(command)
  })

  it('does not mistake an option value for a command name', () => {
    expect(normalizeArgs(['--out-dir', 'build', 'src/index.js']))
      .toEqual(['build', '--out-dir', 'build', 'src/index.js'])
  })

  it('splits an inline value off a short option', () => {
    expect(normalizeArgs(['src/index.js', '-d=out']))
      .toEqual(['build', 'src/index.js', '-d', 'out'])
  })

  it('leaves --help to the main command', () => {
    expect(normalizeArgs(['--help'])).toEqual(['--help'])
  })

  it('treats everything after -- as operands', () => {
    expect(normalizeArgs(['--', '-d=out'])).toEqual(['build', '--', '-d=out'])
    expect(normalizeArgs(['--', 'build'])).toEqual(['build', '--', 'build'])
  })

  it('moves an explicit command in front of the options before it', () => {
    expect(normalizeArgs(['--out-dir', 'out', 'build', 'src/index.js']))
      .toEqual(['build', '--out-dir', 'out', 'src/index.js'])
  })
})

describe('build arguments', () => {
  it('keeps --out-dir when its value spells a command name', () => {
    expect(parseBuild(['--out-dir', 'build', 'src/index.js'])).toMatchObject({
      'out-dir': 'build',
      'file': 'src/index.js',
    })
  })

  it('reads -d=out as a directory named out', () => {
    expect(parseBuild(['src/index.js', '-d=out'])).toMatchObject({ 'out-dir': 'out' })
  })

  it('accepts a bare --watch in front of another option', () => {
    const args = parseBuild(['src/index.js', '--watch', '--out-dir', 'out'])

    expect(args).toMatchObject({ 'watch': true, 'out-dir': 'out' })
    expect(args._).toEqual(['src/index.js'])
  })

  it('turns off watching with --no-watch', () => {
    expect(parseBuild(['src/index.js', '--no-watch'])).toMatchObject({ watch: false })
  })
})

describe('resolveWatchPaths', () => {
  it('splits on commas and trims', () => {
    expect(resolveWatchPaths('src, assets', { allowGlobs: false })).toEqual(['src', 'assets'])
  })

  it('is empty for a missing value', () => {
    expect(resolveWatchPaths(undefined, { allowGlobs: false })).toEqual([])
  })

  it('keeps a glob where the watcher can match one', () => {
    expect(resolveWatchPaths('./**/*.php', { allowGlobs: true })).toEqual(['./**/*.php'])
  })

  it('rejects a glob where chokidar would silently watch nothing', () => {
    expect(() => resolveWatchPaths('src/**/*.js', { allowGlobs: false }))
      .toThrow(/takes files and folders, not patterns/)
  })
})
