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
   * Object or array of objects defining aliases that replace values in
   * `import` statements. With either format, the order of the entries
   * matters: the first defined rules are applied first.
   */
  alias?: AliasOptions

  /**
   * Additional Vite configuration, merged into kirbyup's defaults – for
   * example, to define global constant replacements.
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
