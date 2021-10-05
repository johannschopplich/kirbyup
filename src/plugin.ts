/*
 * Exports are ESM and not part of the kirbyup CLI,
 * but importable when writing a Kirby Panel plugin
 */

/** Single entry of Vite's `import.meta.globEager()` */
type Module = Record<string, any>

const getComponentName = (path: string) =>
  path
    .split('/')
    .pop()!
    .replace(/\.vue$/, '')
    .toLowerCase()

/**
 * Auto-import Kirby Panel components with Vite
 *
 * @example
 * autoImport(import.meta.globEager('./components/blocks/*.vue'))
 */
export const autoImport = (modules: Record<string, Module>) =>
  Object.entries(modules).reduce((acc: Module, [path, component]) => {
    acc[getComponentName(path)] = component.default
    return acc
  }, {})
