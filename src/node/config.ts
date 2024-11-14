import type { PostCSSConfigResult, UserConfig } from './types'
import { loadConfig as _loadConfig } from 'c12'
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'
import postcssrc from 'postcss-load-config'
import postcssLogical from 'postcss-logical'

export function loadConfig(cwd = process.cwd()) {
  return _loadConfig<UserConfig>({
    cwd,
    name: 'kirbyup',
    rcFile: false,
    packageJson: false,
  })
}

export async function resolvePostCSSConfig(cwd: string): Promise<PostCSSConfigResult> {
  try {
    return await postcssrc(undefined, undefined, { stopDir: cwd })
  }
  catch (error) {
    if (!(error as any).message.includes('No PostCSS Config found'))
      throw error

    return {
      plugins: [postcssLogical(), postcssDirPseudoClass()],
    } as PostCSSConfigResult
  }
}
