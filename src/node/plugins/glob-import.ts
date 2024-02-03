import MagicString from 'magic-string'
import type { Plugin, ResolvedConfig } from 'vite'
import { multilineCommentsRE, singlelineCommentsRE } from './utils'

/**
 * Transforms `kirbyup.import(<path>)` to `kirbyup.import(import.meta.glob(<path>, { eager: true }))`
 */
export default function kirbyupGlobImportPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'kirbyup:glob-import',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async transform(code) {
      if (!code.includes('kirbyup.import'))
        return

      const kirbyupImportRE = /\bkirbyup\.import\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*\)/g
      const noCommentsCode = code
        .replace(multilineCommentsRE, m => ' '.repeat(m.length))
        .replace(singlelineCommentsRE, m => ' '.repeat(m.length))
      let s: MagicString | undefined
      let match: RegExpExecArray | null

      // eslint-disable-next-line no-cond-assign
      while ((match = kirbyupImportRE.exec(noCommentsCode))) {
        const { 0: exp, 1: rawPath, index } = match

        if (!s)
          s = new MagicString(code)

        s.overwrite(
          index,
          index + exp.length,
          `kirbyup.import(import.meta.glob(${rawPath}, { eager: true }))`,
        )
      }

      if (s) {
        return {
          code: s.toString(),
          map: config.build.sourcemap ? s.generateMap({ hires: true }) : undefined,
        }
      }
    },
  }
}
