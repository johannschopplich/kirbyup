import MagicString from 'magic-string'
import type { Plugin } from 'vite'

/**
 * The Vite plugin for Vue 2.7 adds a `__file` key to the component's
 * options. We want to remove this key, because it will expose the file path.
 *
 * With Vite 4, Vite will not override `process.env.NODE_ENV` anymore. This
 * environment variable is used by the Vite Vue plugin to determine whether
 * to add the `__file` key to the component's options.
 *
 * @see https://github.com/vitejs/vite-plugin-vue2/blob/ad7d61e0cc545a6dd2c29954dddf036425971560/src/main.ts#L90
 * @see https://vitejs.dev/guide/migration.html#production-builds-by-default
 */
export default function kirbyupComponentCleanupPlugin(): Plugin {
  return {
    name: 'kirbyup:component-cleanup',

    async transform(code) {
      if (!(code).includes('__component__.options.__file'))
        return

      const fileOptionRE = /\b__component__.options.__file\s*=\s*('[^']+'|"[^"]+"|`[^`]+`)/g
      const match = fileOptionRE.exec(code)
      if (!match)
        return

      const { 0: exp, index } = match
      const s = new MagicString(code)

      s.remove(index, index + exp.length)

      return {
        code: s.toString(),
      }
    },
  }
}
