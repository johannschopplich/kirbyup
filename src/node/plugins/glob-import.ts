import type { Plugin, ResolvedConfig } from 'vite'
import MagicString from 'magic-string'
import { stripLiteral } from 'strip-literal'

/**
 * Transforms `kirbyup.import(<path>)` to `kirbyup.import(import.meta.glob(<path>, { eager: true }))`.
 *
 * Must run before Vite's own `import.meta.glob` plugin (also `enforce: 'pre'`),
 * otherwise the emitted call is never expanded.
 */
export default function kirbyupGlobImportPlugin(): Plugin {
  let config: ResolvedConfig

  return {
    name: 'kirbyup:glob-import',
    enforce: 'pre',

    configResolved(resolvedConfig) {
      config = resolvedConfig
    },

    transform(code) {
      if (!code.includes('kirbyup.import'))
        return

      const kirbyupImportRE = /\bkirbyup\.import\s*\(\s*('[^']+'|"[^"]+"|`[^`]+`)\s*\)/dg
      // Skip false matches inside string literals.
      const cleanCode = stripLiteral(code)
      let s: MagicString | undefined

      for (const match of cleanCode.matchAll(kirbyupImportRE)) {
        const { 0: exp, index } = match
        // `cleanCode` blanked the path; read it from the original.
        const [argStart, argEnd] = match.indices![1]!
        const rawPath = code.slice(argStart, argEnd)

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
