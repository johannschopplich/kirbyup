/**
 * Source of the virtual `\0kirbyup:hmr-shim` module, injected at the top of
 * the user's plugin entry.
 *
 * Vue's `reload` does `Object.assign(record.initialDef, newComp)`, which
 * would overwrite Kirby's in-place mutations on the stored definition. The
 * wrap re-runs Kirby's plugin helpers on `newComp` first; see
 * https://github.com/getkirby/kirby/blob/v6/develop/panel/src/panel/plugins.ts
 * ("expose helper functions for kirbyup").
 *
 * `import 'vue'` first ensures `__VUE_HMR_RUNTIME__` exists before the wrap
 * installs. `rerender` is not wrapped: in Vue 3 it only swaps a render
 * function, leaving Kirby's mutations untouched.
 */
export const __HMR_SHIM_CODE__: string = `
import 'vue'

if (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {
  const originalReload = __VUE_HMR_RUNTIME__.reload

  __VUE_HMR_RUNTIME__.reload = function (id, newComp) {
    const plugins = window.panel && window.panel.plugins
    const app = window.panel && window.panel.app

    if (
      plugins
      && app
      && plugins.components
      && typeof plugins.resolveComponentExtension === 'function'
      && typeof plugins.resolveComponentRender === 'function'
      && typeof plugins.resolveComponentMixins === 'function'
    ) {
      for (const name in plugins.components) {
        const pluginComp = plugins.components[name]
        if (
          pluginComp.__hmrId === id
          || (newComp.__file && pluginComp.__file === newComp.__file)
        ) {
          plugins.resolveComponentExtension(app, name, newComp)
          plugins.resolveComponentRender(newComp)
          plugins.resolveComponentMixins(newComp)
          break
        }
      }
    }

    return originalReload.call(this, id, newComp)
  }
}
else {
  console.warn(
    "[kirbyup] Vue HMR runtime not detected; component changes will fall back to full page reload. The Kirby Panel may be loading a production build of Vue."
  )
}
`.trimStart()

/**
 * Extract public named exports from a Rollup-style ESM bundle. Vue's
 * `dist/vue.esm-browser.js` ships a single trailing `export { ... }` block
 * with a few `internalName as publicName` aliases.
 *
 * Only the last block is read; `as`-aliased entries yield the public name.
 */
export function extractEsmNamedExports(source: string): string[] {
  const blockMatches = [...source.matchAll(/export\s*\{([^}]*)\}/g)]
  if (blockMatches.length === 0)
    return []

  const lastBlock = blockMatches.at(-1)![1]!
  return lastBlock
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const aliasMatch = entry.match(/^\S+\s+as\s+(\S+)$/)
      return aliasMatch ? aliasMatch[1]! : entry
    })
}

/**
 * Source of the virtual `\0kirbyup:vue-stub` module. Reads Kirby's panel-vue
 * URL at runtime from the page's `<script type="importmap">` and dynamic-imports
 * it; the browser's module map dedups by URL, so plugin SFCs share Kirby's
 * Vue instance (and `__VUE_HMR_RUNTIME__`). Top-level await lets consumers
 * keep using ordinary `import { ... } from 'vue'` syntax.
 *
 * `/* @vite-ignore *\/` stops Vite from trying to resolve the URL statically.
 */
export function buildVueStubCode(namedExports: readonly string[]): string {
  const exportsDestructure = namedExports.length === 0
    ? ''
    : `\nexport const {\n${namedExports.map(name => `  ${name},`).join('\n')}\n} = __kirbyupVueModule\n`

  return `
const __kirbyupVueImportMapEl = typeof document !== 'undefined'
  ? document.querySelector('script[type="importmap"]')
  : null
const __kirbyupVueImports = __kirbyupVueImportMapEl
  ? (() => {
      try { return JSON.parse(__kirbyupVueImportMapEl.textContent || '{}').imports || {} }
      catch (_) { return {} }
    })()
  : {}
const __kirbyupVueUrl = __kirbyupVueImports.vue
if (!__kirbyupVueUrl) {
  throw new Error(
    '[kirbyup] No "vue" entry found in the page <script type=\\"importmap\\">. Ensure Kirby's Panel is loaded with v6 import maps enabled.'
  )
}
const __kirbyupVueModule = await import(/* @vite-ignore */ __kirbyupVueUrl)

${exportsDestructure}
`.trimStart()
}
