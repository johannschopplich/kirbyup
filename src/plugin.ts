// Exports are ESM and not part of the kirbyup CLI,
// but importable when writing a Kirby Panel plugin

const getComponentName = (path: string) =>
  path
    .split('/')
    .pop()!
    .replace(/\.vue$/, '')
    .toLowerCase()

/**
 * Auto-import Kirby Panel components with Vite
 */
export const autoImport = (modules: string) =>
  // @ts-expect-error
  Object.entries(import.meta.globEager(modules)).reduce(
    (acc: Record<string, any>, [path, component]) => {
      acc[getComponentName(path)] = (component as any).default
      return acc
    },
    {}
  )
