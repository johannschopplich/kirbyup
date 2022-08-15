import { existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'pathe'
import type { Plugin, ResolvedConfig } from 'vite'
import type { BuildOptions } from '../types'

export default function kirbyupBuildCleanupPlugin(options: BuildOptions): Plugin {
  let config: ResolvedConfig
  let indexMjs: string

  return {
    name: 'kirbyup:build-cleanup',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      indexMjs = resolve(config.root, options.outDir, 'index.dev.mjs')
    },
    writeBundle() {
      if (existsSync(indexMjs))
        unlinkSync(indexMjs)
    },
  }
}
