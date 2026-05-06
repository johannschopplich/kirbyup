import type { Plugin, ResolvedConfig } from 'vite'
import type { BuildOptions } from '../types'
import * as fs from 'node:fs'
import { resolve } from 'pathe'

export function kirbyupBuildCleanupPlugin(options: BuildOptions): Plugin {
  let config: ResolvedConfig
  let devIndexPath: string

  return {
    name: 'kirbyup:build-cleanup',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      devIndexPath = resolve(config.root, options.outDir, 'index.dev.js')
    },
    writeBundle() {
      // Skip in watch mode – `index.dev.js` is the build's own output there.
      if (options.watch)
        return

      if (fs.existsSync(devIndexPath))
        fs.unlinkSync(devIndexPath)
    },
  }
}
