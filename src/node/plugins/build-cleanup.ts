import { existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'pathe'
import type { Plugin, ResolvedConfig } from 'vite'

export default function kirbyupBuildCleanupPlugin(): Plugin {
  let config: ResolvedConfig
  let indexMjs: string

  return {
    name: 'kirbyup:build-cleanup',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      indexMjs = resolve(config.root, 'index.dev.mjs')
    },
    writeBundle() {
      if (existsSync(indexMjs))
        unlinkSync(indexMjs)
    },
  }
}
