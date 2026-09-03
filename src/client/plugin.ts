type Module = Record<string, any>

export interface KirbyupUtilities {
  import: (glob: string) => Record<string, any>
}

export const kirbyup: Readonly<KirbyupUtilities> = Object.freeze({
  /**
   * Auto-imports the Kirby Panel components matching a glob.
   *
   * @example
   * kirbyup.import('./components/blocks/*.vue')
   */
  import(glob: string): Record<string, any> {
    // `kirbyupGlobImportPlugin` rewrites the argument to an eager
    // `import.meta.glob` at build time, so a string here means it never ran.
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
