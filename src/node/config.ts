import type { ConfigLayerMeta, ResolvedConfig } from 'c12'
import type { UserConfig } from './types.ts'
import { loadConfig as _loadConfig } from 'c12'

export function loadConfig(cwd: string = process.cwd()): Promise<ResolvedConfig<UserConfig, ConfigLayerMeta>> {
  return _loadConfig<UserConfig>({
    cwd,
    name: 'kirbyup',
    rcFile: false,
    packageJson: false,
  })
}
