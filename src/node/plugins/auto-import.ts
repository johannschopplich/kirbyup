import MagicString from 'magic-string'
import type { Plugin, ResolvedConfig } from 'vite'
import { multilineCommentsRE, singlelineCommentsRE } from './utils'

/**
 * Transform `kirbyup.import(<path>)` to
 * `kirbyup.import(import.meta.glob(<path>, { eager: true }))`
 */
export default function kirbyupAutoImportPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'kirbyup:auto-import',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async transform(code) {
      if (code.includes('kirbyup.import')) {
        const kirbyupImportRE
          = /\bkirbyup\.import\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*\)/g
        const noCommentsCode = code
          .replace(multilineCommentsRE, m => ' '.repeat(m.length))
          .replace(singlelineCommentsRE, m => ' '.repeat(m.length))
        let s: MagicString | null = null
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
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null,
          }
        }
      }

      return null
    },
  }
}
