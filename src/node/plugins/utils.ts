/**
 * Code served as the virtual module `\0kirbyup:hmr-shim`. It is imported once
 * from the top of the user's plugin entry by `kirbyupHmrPlugin`'s `transform`
 * hook. ESM module dedup guarantees a single shared install point – equivalent
 * to the `\0plugin-vue2:hmr-runtime` virtual module pattern that gave Vue 2 its
 * "single shared HMR runtime" property.
 *
 * Vue 3's `__VUE_HMR_RUNTIME__` lives on `globalThis` and is set up by
 * `@vue/runtime-core` when first imported. Its records map is module-private,
 * so we cannot inspect it – we only need to ensure that `reload(id, newComp)`
 * sees a `newComp` that has already been put through Kirby's plugin
 * modifications (mixin/extends/render). Otherwise Vue's `Object.assign`-based
 * reload would clobber Kirby's mutations on the stored definition with the
 * raw SFC export and the next render would see e.g. an unresolved `'section'`
 * mixin string or an unresolved `extends` reference.
 *
 * Kirby v6 explicitly exposes the helpers we need for this – see
 * https://github.com/getkirby/kirby/blob/v6/develop/panel/src/panel/plugins.ts
 * (search for "expose helper functions for kirbyup").
 *
 * The leading `import 'vue'` ensures `__VUE_HMR_RUNTIME__` is initialised
 * before we try to wrap it. Without it the shim would run before any other
 * `.vue` import has had a chance to load `@vue/runtime-core`.
 *
 * `rerender(id, newRender)` is intentionally NOT wrapped. In Vue 3 it only
 * swaps a render function on existing instances; Kirby's other modifications
 * are unaffected. (The Vue 2 era wrap was needed because of identity
 * differences between `Vue.extend` constructors and their `.options`.)
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
`.trimStart()

/**
 * Extract the public named exports from a fully-bundled Rollup-style ESM
 * source. Vue's `dist/vue.esm-browser.js` is shipped exactly that way: a
 * single trailing `export { ... }` block listing every public API name, with
 * a few `internalName as publicName` aliases.
 *
 * Only the LAST `export { ... }` block is considered – Vue's bundle has
 * exactly one such block on the final non-empty line of the file. Names with
 * `as` aliases yield the public (post-`as`) name; the internal symbol is not
 * importable from `'vue'` and is intentionally dropped.
 *
 * Returns an empty array if no export block is found.
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
 * Build the source of the virtual `\0kirbyup:vue-stub` module. The stub runs
 * in the browser, reads the page's `<script type="importmap">` to discover
 * the URL Kirby's Panel uses for `vue`, dynamic-imports that URL, and
 * re-exports the requested names.
 *
 * The browser's module map dedups by final URL, so plugin SFCs and Kirby's
 * own panel code end up sharing a single Vue module instance – and a single
 * `__VUE_HMR_RUNTIME__`. Top-level await keeps the dynamic import inside the
 * stub's evaluation, so consumers can keep using ordinary
 * `import { ... } from 'vue'` syntax.
 *
 * `/* @vite-ignore *\/` on the dynamic import prevents Vite's static analysis
 * from trying to resolve the URL at server time.
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
    "[kirbyup] No 'vue' entry found in the page <script type=\\"importmap\\">. Ensure Kirby's Panel is loaded with v6 import maps enabled."
  )
}
const __kirbyupVueModule = await import(/* @vite-ignore */ __kirbyupVueUrl)

${exportsDestructure}
`.trimStart()
}
