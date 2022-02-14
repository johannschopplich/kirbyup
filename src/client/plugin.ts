/*
 * Exports are ESM and not part of the kirbyup CLI,
 * but importable when writing a Kirby Panel plugin
 */

type Module = {
  [key: string]: any
}

const getComponentName = (path: string) =>
  path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.')).toLowerCase()

/*
 * Set of utils for Kirby Panel plugins
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
    return Object.entries(modules).reduce<Record<string, any>>(
      (accumulator, [path, component]) => {
        accumulator[getComponentName(path)] = component.default
        return accumulator
      },
      {}
    )
  }
})
