import * as fsp from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'pathe'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ensureViteRunningMarker, removeViteRunningMarker, VITE_RUNNING_FILENAME } from '../src/node/plugins/vite-running'

describe('vite-running marker', () => {
  let tempRoot: string

  beforeEach(async () => {
    tempRoot = await fsp.mkdtemp(resolve(tmpdir(), 'kirbyup-vite-running-'))
  })

  afterEach(async () => {
    if (tempRoot)
      await fsp.rm(tempRoot, { recursive: true, force: true })
  })

  it('creates marker inside site/plugins directory', async () => {
    const pluginDir = resolve(tempRoot, 'site/plugins/demo')
    await fsp.mkdir(pluginDir, { recursive: true })

    const markerPath = await ensureViteRunningMarker(pluginDir)

    expect(markerPath).toBe(resolve(pluginDir, VITE_RUNNING_FILENAME))
    expect(await fileExists(markerPath!)).toBe(true)

    await removeViteRunningMarker(markerPath)
    expect(await fileExists(markerPath!)).toBe(false)
  })

  it('returns undefined for non-plugin directories', async () => {
    const randomDir = resolve(tempRoot, 'packages/demo')
    await fsp.mkdir(randomDir, { recursive: true })

    const markerPath = await ensureViteRunningMarker(randomDir)
    expect(markerPath).toBeUndefined()
  })
})

async function fileExists(path: string): Promise<boolean> {
  try {
    await fsp.access(path)
    return true
  }
  catch {
    return false
  }
}
