import type { MarkRequired } from 'ts-essentials'
import type { InlineConfig } from 'vite'
import type * as Postcss from 'postcss'

export type CliOptions = {
  entry?: string
  outDir?: string
  watch?: boolean | string | Array<boolean | string>
}

export type ResolvedCliOptions = MarkRequired<CliOptions, 'entry'>

export interface UserConfig {
  /**
   * Defines aliases used to replace values in `import` or
   * `require` statements. The order of the entries is important,
   * in that the first defined rules are applied first.
   */
  alias?: { [find: string]: string }

  /**
   * Extends Vite's configuration. Will be merged with kirbyup's
   * default configuration. Be careful what to extend.
   */
  extendVite?: InlineConfig
}

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
