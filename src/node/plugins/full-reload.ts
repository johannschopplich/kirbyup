import type { Plugin } from 'vite'
import { relative, resolve } from 'node:path'
import { createFilter, normalizePath } from 'vite'
import * as output from '../output.ts'
import { toArray } from '../utils.ts'

/**
 * Triggers a full browser reload when a watched file changes. The matching is
 * `createFilter`, not the watcher: Vite already watches the project root, and
 * chokidar has expanded no globs since v4, so adding a pattern to it does nothing.
 */
export function kirbyupFullReloadPlugin(paths: string | string[]): Plugin {
  return {
    name: 'kirbyup:full-reload',
    apply: 'serve',

    configureServer({ watcher, ws, config: { root } }) {
      const matches = createFilter(toArray(paths).map(path => resolve(root, path)))

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
