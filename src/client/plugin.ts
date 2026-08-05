type Module = Record<string, any>

export interface KirbyupUtilities {
  import: (glob: string) => Record<string, any>
}

export const kirbyup: Readonly<KirbyupUtilities> = Object.freeze({
  /**
   * Auto-imports Kirby Panel components, transformed by
   * kirbyup's glob-import plugin for Vite.
   *
   * @example
   * kirbyup.import('./components/blocks/*.vue')
   */
  import(glob: string): Record<string, any> {
    // `kirbyup.import(<path>)` is transformed at build-time to:
    // `kirbyup.import(import.meta.glob(<path>, { eager: true }))`.
    // If we still see a string here, the kirbyup build pipeline didn't run.
    if (typeof glob === 'string') {
      throw new TypeError(
        '[kirbyup] kirbyup.import() requires the kirbyup build pipeline. The call must be transformed at build time by the kirbyup:glob-import plugin.',
      )
    }

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
