import type { AliasOptions, InlineConfig } from 'vite'
import type * as PostCSS from 'postcss'

export interface BaseOptions {
  cwd: string
  entry: string
}

export interface ServeOptions extends BaseOptions {
  watch: false | string | string[]
  port: number
  outDir?: string
}

export interface BuildOptions extends BaseOptions {
  outDir: string
  watch: boolean | string | string[]
}

export interface UserConfig {
  /**
   * Load from config files
   * Set to `false` to disable
   */
  configFile?: string | false

  /**
   * Specifies an `Object`, or an `Array` of `Object`,
   * which defines aliases used to replace values in `import` statements.
   * With either format, the order of the entries is important,
   * in that the first defined rules are applied first.
   */
  alias?: AliasOptions

  /**
   * Extends Vite's configuration. Will be merged with kirbyup's
   * default configuration. Be careful what to extend.
   */
  extendViteConfig?: InlineConfig
}

export interface PostCSSConfigResult {
  options?: PostCSS.ProcessOptions
  plugins: PostCSS.Plugin[]
}
