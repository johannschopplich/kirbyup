import type { MarkRequired } from 'ts-essentials'
import type * as Postcss from 'postcss'

/** Array, or not yet */
export type Arrayable<T> = T | Array<T>

export type Options = {
  entry?: string
  outDir?: string
  watch?: Arrayable<boolean | string>
}

export type NormalizedOptions = MarkRequired<Options, 'entry'>

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
