import type { UserConfig } from '../node/types.ts'

export type { UserConfig }

export function defineConfig(config: UserConfig): UserConfig {
  return config
}
