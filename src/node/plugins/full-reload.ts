import type { Plugin } from 'vite'
import { colors } from 'consola/utils'
import { relative, resolve } from 'pathe'
import { createFilter } from 'vite'
import { toArray } from '../utils'

/**
 * Triggers a full browser reload when files matching the given globs change.
 * Vite forces chokidar's `disableGlobbing: true` by default; this plugin
 * resets it so glob strings passed to `watcher.add` are expanded by chokidar.
 */
export function kirbyupFullReloadPlugin(paths: string | string[]): Plugin {
  return {
    name: 'kirbyup:full-reload',
    apply: 'serve',

    config() {
      return { server: { watch: { disableGlobbing: false } } }
    },

    configureServer({ watcher, ws, config: { root, logger } }) {
      const files = toArray(paths).map(p => resolve(root, p))
      const matches = createFilter(files)

      watcher.add(files)

      const reload = (path: string) => {
        if (!matches(path))
          return

        // Preserve the async gap from the original vite-plugin-full-reload
        setTimeout(() => ws.send({ type: 'full-reload', path: '*' }), 0)

        logger.info(
          `${colors.green('full reload')} ${colors.dim(relative(root, path))}`,
          { clear: true, timestamp: true },
        )
      }

      watcher.on('add', reload)
      watcher.on('change', reload)
    },
  }
}
