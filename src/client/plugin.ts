/*
 * Exports are ESM and not part of the kirbyup CLI,
 * but importable when writing a Kirby Panel plugin
 */

/** Inherits Vite's `import.meta.globEager` result type */
type GlobEagerResult = Record<
  string,
  {
    [key: string]: any
  }
>

const getComponentName = (path: string) =>
  path
    .split('/')
    .pop()!
    .replace(/\.vue$/, '')
    .toLowerCase()

/*
 * Set of Utils for Kirby Plugins
 */
export const kirbyup = Object.freeze({
  /**
   * Auto-import Kirby Panel components, will be transformed by
   * kirbyup's auto import plugin for Vite
   *
   * @example
   * kirbyup.import('./components/blocks/*.vue')
   */
  import(modules: GlobEagerResult) {
    return Object.entries(modules).reduce((acc, [path, component]) => {
      acc[getComponentName(path)] = component.default
      return acc
    }, {} as Record<string, any>)
  }
})
