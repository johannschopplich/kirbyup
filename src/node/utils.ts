export function toArray<T>(array?: T | T[]): T[] {
  array ??= []
  return Array.isArray(array) ? array : [array]
}
