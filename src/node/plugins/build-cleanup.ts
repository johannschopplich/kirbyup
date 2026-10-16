import type { Plugin, ResolvedConfig } from 'vite'
import type { BuildOptions } from '../types.ts'
import * as fs from 'node:fs'
import { resolve } from 'node:path'

// TODO: Drop once Vite strips its own marker in library mode. It appends the
// marker in `finalizeCss` and removes it at the end of `generateBundle`, but in
// library mode the same hook emits the stylesheet, so the asset is not in the
// bundle yet when the removal runs.
const VITE_HASH_UPDATE_MARKER_RE = /\/\*\$vite\$:\d+\*\/\s*$/

export function kirbyupBuildCleanupPlugin(options: BuildOptions): Plugin {
  let config: ResolvedConfig
  let devIndexPath: string
  let devStylesheetPath: string

  return {
    name: 'kirbyup:build-cleanup',
    // Runs after `vite:css-post`, which is what emits the stylesheet asset.
    enforce: 'post',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      devIndexPath = resolve(config.root, options.outDir, 'index.dev.js')
      devStylesheetPath = resolve(config.root, options.outDir, 'index.dev.css')
    },

    generateBundle(_outputOptions, bundle) {
      for (const item of Object.values(bundle)) {
        if (item.type === 'asset' && typeof item.source === 'string')
          item.source = item.source.replace(VITE_HASH_UPDATE_MARKER_RE, '')
      }
    },

    writeBundle(_outputOptions, bundle) {
      // A watch build without CSS removes the stylesheet an earlier one wrote,
      // which Kirby would still pair with `index.dev.js`.
      if (options.watch) {
        if (!('index.dev.css' in bundle))
          fs.rmSync(devStylesheetPath, { force: true })
        return
      }

      fs.rmSync(devIndexPath, { force: true })
      fs.rmSync(devStylesheetPath, { force: true })
    },
  }
}
