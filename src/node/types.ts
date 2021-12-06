import type { MarkRequired } from 'ts-essentials'
import type { AliasOptions } from 'vite'
import type * as Postcss from 'postcss'

export type CliOptions = {
  entry?: string
  outDir?: string
  watch?: boolean | string | Array<boolean | string>
}

export type ResolvedCliOptions = MarkRequired<CliOptions, 'entry'>

export interface UserConfig {
  alias?: AliasOptions
}

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
