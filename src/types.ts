import { MarkRequired } from 'ts-essentials'

/** Array, or not yet an array */
export type Arrayable<T> = T | Array<T>

export type Options = {
  entry?: string
  watch?: Arrayable<boolean | string>
}

export type NormalizedOptions = MarkRequired<Options, 'entry'>
