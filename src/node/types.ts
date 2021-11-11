import type { MarkRequired } from 'ts-essentials'
import type * as Postcss from 'postcss'

export type MaybeArray<T> = T | Array<T>

export type Options = {
  entry?: string
  outDir?: string
  watch?: MaybeArray<boolean | string>
}

export type NormalizedOptions = MarkRequired<Options, 'entry'>

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
