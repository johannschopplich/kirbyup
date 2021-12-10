import type { MarkRequired } from 'ts-essentials'
import type { InlineConfig, AliasOptions } from 'vite'
import type * as Postcss from 'postcss'

export type CliOptions = {
  entry?: string
  outDir?: string
  watch?: boolean | string | Array<boolean | string>
}

export type ResolvedCliOptions = MarkRequired<CliOptions, 'entry'>

export interface UserConfig {
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
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
