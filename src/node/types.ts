import type { MarkRequired } from 'ts-essentials'
import type * as Postcss from 'postcss'

export type MaybeArray<T> = T | Array<T>

export type CliOptions = {
  entry?: string
  outDir?: string
  watch?: MaybeArray<boolean | string>
}

export type ResolvedCliOptions = MarkRequired<CliOptions, 'entry'>

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
