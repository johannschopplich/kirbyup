import { loadConfig as _loadConfig } from 'c12'
import type { LoadConfigResult, LoadConfigSource } from 'unconfig'
import type { UserConfig } from './types'

export type { LoadConfigResult, LoadConfigSource }

export function loadConfig(cwd = process.cwd()) {
  return _loadConfig<UserConfig>({
    cwd,
    name: 'kirbyup',
    rcFile: false,
    jitiOptions: {
      interopDefault: true,
      esmResolve: true,
    },
  })
}
