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
  // path.match(/([^\/]+)(?=\.\w+$)/)![0].toLowerCase()
  path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.')).toLowerCase()

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
    return Object.entries(modules).reduce<Record<string, any>>(
      (accumulator, [path, component]) => {
        accumulator[getComponentName(path)] = component.default
        return accumulator
      },
      {}
    )
  }
})
