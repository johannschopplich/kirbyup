import type { ConfigLayerMeta, ResolvedConfig } from 'c12'
import type postcssrc from 'postcss-load-config'
import type { UserConfig } from './types'
import { loadConfig as _loadConfig } from 'c12'
import postcssrcLoad from 'postcss-load-config'

export type PostCSSConfigResult = postcssrc.Result

export function loadConfig(cwd: string = process.cwd()): Promise<ResolvedConfig<UserConfig, ConfigLayerMeta>> {
  return _loadConfig<UserConfig>({
    cwd,
    name: 'kirbyup',
    rcFile: false,
    packageJson: false,
  })
}

export async function resolvePostCSSConfig(cwd: string): Promise<PostCSSConfigResult | undefined> {
  try {
    return await postcssrcLoad(undefined, undefined, { stopDir: cwd })
  }
  catch (error) {
    if (!(error as any).message.includes('No PostCSS Config found'))
      throw error
  }
}
