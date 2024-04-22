import type * as PostCSS from 'postcss'
import type { AliasOptions, InlineConfig } from 'vite'

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
   * Specifies an object or an array of objects, which defines aliases
   * used to replace values in `import` statements.
   * With either format, the order of the entries is important,
   * in that the first defined rules are applied first.
   */
  alias?: AliasOptions

  /**
   * Extends Vite's configuration. Will be merged with kirbyup's
   * default configuration. For example, you can define global constant replacements.
   *
   * @example
   * export default defineConfig({
   *   vite: {
   *    define: {
   *     __TEST__: JSON.stringify(process.env.TEST === 'true'),
   *   },
   * })
   */
  vite?: InlineConfig
}

export interface PostCSSConfigResult {
  options: PostCSS.ProcessOptions
  plugins: PostCSS.AcceptedPlugin[]
}
