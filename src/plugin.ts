/*
 * Exports are ESM and not part of the kirbyup CLI,
 * but importable when writing a Kirby Panel plugin
 */

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
export const autoImport = (modules: Record<string, Record<string, any>>) =>
  Object.entries(modules).reduce(
    (acc: Record<string, any>, [path, component]) => {
      acc[getComponentName(path)] = (component as any).default
      return acc
    },
    {}
  )
