import type { Plugin } from 'vite'
import * as fs from 'node:fs'
import { relative, resolve } from 'node:path'
import { createFilter, normalizePath } from 'vite'
import * as output from '../output.ts'
import { toArray } from '../utils.ts'

/**
 * Triggers a full browser reload when a watched file changes. The matching is
 * `createFilter`, not the watcher: Vite's watcher expands no globs. It watches
 * only the project root, so the paths are added to it for those outside.
 */
export function kirbyupFullReloadPlugin(paths: string | string[]): Plugin {
  return {
    name: 'kirbyup:full-reload',
    apply: 'serve',

    configureServer({ watcher, ws, config: { root } }) {
      const resolvedPaths = toArray(paths).map(path => resolve(root, path))
      const matches = createFilter(resolvedPaths.map(path =>
        fs.statSync(path, { throwIfNoEntry: false })?.isDirectory() ? `${path}/**` : path,
      ))

      watcher.add(resolvedPaths)

      const reload = (path: string) => {
        if (!matches(path))
          return

        // Preserves the async gap from the original vite-plugin-full-reload.
        setTimeout(() => ws.send({ type: 'full-reload', path: '*' }), 0)

        output.fullReload(normalizePath(relative(root, path)))
      }

      watcher.on('add', reload)
      watcher.on('change', reload)
    },
  }
}
