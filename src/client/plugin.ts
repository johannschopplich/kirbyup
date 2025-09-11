// Exports are ESM and not part of the kirbyup CLI,
// but importable when writing a Kirby Panel plugin.

type Module = Record<string, any>

export interface KirbyupUtilities {
  import: (glob: string) => Record<string, any>
}

/*
 * Set of utils for Kirby Panel plugins.
 */
export const kirbyup: Readonly<KirbyupUtilities> = Object.freeze({
  /**
   * Auto-import Kirby Panel components, transformed by
   * kirbyup's glob-import plugin for Vite.
   *
   * @example
   * kirbyup.import('./components/blocks/*.vue')
   */
  import(glob: string): Record<string, any> {
    // `kirbyup.import(<path>)` will be transformed by the auto import plugin,
    // which will change the signature at build-time to:
    // `kirbyup.import(import.meta.glob(<path>, { eager: true }))`
    // Thus, we have to force a type cast here.
    const modules = glob as unknown as Record<string, Module>
    return Object.entries(modules).reduce<Record<string, any>>(
      (accumulator, [path, component]) => {
        accumulator[getComponentName(path)] = component.default
        return accumulator
      },
      {},
    )
  },
})

function getComponentName(path: string) {
  return path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.')).toLowerCase()
}
