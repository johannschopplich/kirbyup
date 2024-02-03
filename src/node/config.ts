import { loadConfig as _loadConfig } from 'c12'
import postcssrc from 'postcss-load-config'
import postcssLogical from 'postcss-logical'
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'
import type { PostCSSConfigResult, UserConfig } from './types'

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
