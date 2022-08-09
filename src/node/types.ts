import type { AliasOptions, InlineConfig } from 'vite'
import type * as Postcss from 'postcss'

export interface BaseOptions {
  cwd: string
  entry: string
}

export interface ServeOptions extends BaseOptions {
  watch: false | string | string[]
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
   * Specifies the port for the development server.
   */
  port?: number

  /**
   * Extends Vite's configuration. Will be merged with kirbyup's
   * default configuration. Be careful what to extend.
   */
  extendViteConfig?: InlineConfig
}

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}

export type GetViteConfigFn = (...args: ['build', BuildOptions] | ['serve', ServeOptions]) => InlineConfig
