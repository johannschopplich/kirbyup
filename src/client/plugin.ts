/*
 * Exports are ESM and not part of the kirbyup CLI,
 * but importable when writing a Kirby Panel plugin
 */

/** Single entry of Vite's `import.meta.globEager` function */
type Module = Record<string, any>

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
  import(modules: Record<string, Module>) {
    return Object.entries(modules).reduce((acc: Module, [path, component]) => {
      acc[getComponentName(path)] = component.default
      return acc
    }, {})
  }
})
