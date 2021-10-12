import MagicString from 'magic-string'
import { multilineCommentsRE, singlelineCommentsRE } from './utils'
import type { Plugin, ResolvedConfig } from 'vite'

/**
 * Transform `kirbyup.import(<path>)` to
 * `kirbyup.import(import.meta.globEager(<path>))`
 */
export default function kirbyupAutoImportPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'kirbyup:auto-import',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    async transform(code, id) {
      if (code.includes('kirbyup.import')) {
        const kirbyupImportRE =
          /\bkirbyup\.import\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*\)/g
        const noCommentsCode = code
          .replace(multilineCommentsRE, (m) => ' '.repeat(m.length))
          .replace(singlelineCommentsRE, (m) => ' '.repeat(m.length))
        let s: MagicString | null = null
        let match: RegExpExecArray | null

        while ((match = kirbyupImportRE.exec(noCommentsCode))) {
          const { 0: exp, 1: rawPath, index } = match

          if (!s) s = new MagicString(code)

          s.overwrite(
            index,
            index + exp.length,
            `kirbyup.import(import.meta.globEager(${rawPath}))`
          )
        }

        if (s) {
          return {
            code: s.toString(),
            map: config.build.sourcemap ? s.generateMap({ hires: true }) : null
          }
        }
      }

      return null
    }
  }
}
