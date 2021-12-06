import { resolve, dirname } from 'pathe'
import { existsSync, statSync } from 'fs'
import { UserConfig } from './types'
import {
  createConfigLoader as createLoader,
  LoadConfigResult,
  LoadConfigSource
} from 'unconfig'

export type { LoadConfigResult, LoadConfigSource }

export function createConfigLoader<U extends UserConfig>(
  configOrPath: string | U = process.cwd(),
  extraConfigSources: LoadConfigSource[] = []
): () => Promise<LoadConfigResult<U>> {
  let inlineConfig = {} as U

  if (typeof configOrPath !== 'string') {
    inlineConfig = configOrPath
    configOrPath = process.cwd()
  }

  const resolved = resolve(configOrPath)
  let cwd = resolved

  let isFile = false
  if (existsSync(resolved) && statSync(resolved).isFile()) {
    isFile = true
    cwd = dirname(resolved)
  }

  const loader = createLoader<U>({
    sources: isFile
      ? [
          {
            files: resolved,
            extensions: []
          }
        ]
      : [
          {
            files: ['kirbyup.config']
          },
          ...extraConfigSources
        ],
    cwd,
    defaults: inlineConfig
  })

  return async () => {
    const result = await loader.load()
    result.config = result.config || inlineConfig
    return result
  }
}

export function loadConfig<U extends UserConfig>(dirOrPath: string | U) {
  return createConfigLoader<U>(dirOrPath)()
}
