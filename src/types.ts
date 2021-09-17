// prettier-ignore
/** Mark some properties as required, leaving others unchanged */
export type MarkRequired<T, RK extends keyof T> = Exclude<T, RK> & Required<Pick<T, RK>>

/** Array, or not yet an array */
export type Arrayable<T> = T | Array<T>

export type Options = {
  entry?: string
  watch?: Arrayable<boolean | string>
}

export type NormalizedOptions = MarkRequired<Options, 'entry'>
