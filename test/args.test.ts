import { parseArgs } from 'utilful/cli'
import { describe, expect, it } from 'vitest'
import { buildArgs } from '../src/node/commands/build.ts'
import { devArgs } from '../src/node/commands/dev.ts'
import { resolveWatchPaths } from '../src/node/commands/watch-paths.ts'

describe('build arguments', () => {
  it('accepts a bare --watch in front of another option', () => {
    const args = parseArgs(['src/index.js', '--watch', '--out-dir', 'out'], buildArgs)

    expect(args).toMatchObject({ 'watch': true, 'out-dir': 'out' })
    expect(args._).toEqual(['src/index.js'])
  })

  it('does not watch unless asked', () => {
    expect(parseArgs(['src/index.js'], buildArgs).watch).toBe(false)
  })
})

describe('dev arguments', () => {
  it('watches PHP files unless told otherwise', () => {
    expect(parseArgs(['src/index.js'], devArgs)).toMatchObject({ 'watch': true, 'watch-path': './**/*.php' })
  })

  it('turns off watching with --no-watch', () => {
    expect(parseArgs(['src/index.js', '--no-watch'], devArgs).watch).toBe(false)
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
