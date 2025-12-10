import type { Plugin, ResolvedConfig } from 'vite'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { basename, dirname, normalize, resolve } from 'pathe'

export const VITE_RUNNING_FILENAME = '.vite-running'

export interface RunningMarkerPluginOptions {
  outDir?: string
}

export function kirbyupRunningMarkerPlugin(options: RunningMarkerPluginOptions = {}): Plugin {
  let config: ResolvedConfig
  let pluginDir: string
  let markerPath: string | undefined
  let exitCleanupRegistered = false

  const ensureMarker = async () => {
    if (markerPath)
      return

    try {
      const resolvedPath = await ensureViteRunningMarker(pluginDir)
      if (resolvedPath)
        markerPath = resolvedPath
    }
    catch (error) {
      config.logger.warn(`[kirbyup] Failed to write ${VITE_RUNNING_FILENAME}: ${(error as Error).message}`)
    }
  }

  const cleanupMarker = async () => {
    if (!markerPath)
      return

    try {
      await removeViteRunningMarker(markerPath)
    }
    catch (error) {
      config.logger.warn(`[kirbyup] Failed to remove ${VITE_RUNNING_FILENAME}: ${(error as Error).message}`)
    }
    finally {
      markerPath = undefined
    }
  }

  const registerProcessCleanup = () => {
    if (exitCleanupRegistered)
      return

    exitCleanupRegistered = true
    process.once('exit', () => {
      if (markerPath && fs.existsSync(markerPath)) {
        try {
          fs.rmSync(markerPath, { force: true })
        }
        catch { /* noop */ }
      }
    })
  }

  return {
    name: 'kirbyup:vite-running',
    configResolved(resolved) {
      config = resolved
      pluginDir = resolve(resolved.root, options.outDir || '')
      registerProcessCleanup()
    },
    configureServer(server) {
      server.httpServer?.once('listening', () => ensureMarker())
      server.httpServer?.once('close', () => cleanupMarker())
    },
    buildStart() {
      if (config.command !== 'build' || !config.build.watch)
        return

      ensureMarker()
    },
  }
}

/**
 * Creates the `.vite-running` marker file if the directory is inside `site/plugins/`.
 * Returns `undefined` if the directory is not a Kirby plugin directory.
 */
export async function ensureViteRunningMarker(targetDir: string): Promise<string | undefined> {
  if (!isInsideKirbyPlugins(targetDir))
    return

  const markerPath = resolve(targetDir, VITE_RUNNING_FILENAME)
  await fsp.writeFile(markerPath, '', 'utf8')
  return markerPath
}

/**
 * Removes the `.vite-running` marker file.
 */
export async function removeViteRunningMarker(markerPath?: string | undefined): Promise<void> {
  if (!markerPath)
    return

  await fsp.rm(markerPath, { force: true })
}

/**
 * Checks if a directory is inside a Kirby plugin directory (`site/plugins/*`).
 * This is used to determine whether to create the `.vite-running` marker file,
 * which Kirby 6+ uses to detect development mode and load the development
 * build of Vue instead of the production build.
 */
function isInsideKirbyPlugins(targetDir: string): boolean {
  const initialDir = normalize(targetDir)
  let currentDir = initialDir

  while (true) {
    const parentDir = dirname(currentDir)

    if (
      currentDir !== initialDir
      && isPathSegmentEqual(basename(currentDir), 'plugins')
      && isPathSegmentEqual(basename(parentDir), 'site')
    ) {
      return true
    }

    // Reached filesystem root
    if (currentDir === parentDir)
      return false

    currentDir = parentDir
  }
}

/**
 * Performs case-insensitive comparison of path segments.
 */
function isPathSegmentEqual(segment: string, expected: string): boolean {
  return segment.toLowerCase() === expected
}
