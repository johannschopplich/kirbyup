import HMR_SHIM_SOURCE from './runtime/hmr-shim.js?raw'
import VUE_STUB_SOURCE from './runtime/vue-stub.js?raw'

/**
 * Vue's `reload` does `Object.assign(record.initialDef, newComp)`, which would
 * overwrite Kirby's in-place mutations on the stored definition. The shim
 * re-runs Kirby's plugin helpers on `newComp` first; see
 * https://github.com/getkirby/kirby/blob/v6/develop/panel/src/panel/plugins.ts
 * ("expose helper functions for kirbyup"). `rerender` is not wrapped: in Vue 3
 * it only swaps a render function, leaving Kirby's mutations untouched.
 */
export const __HMR_SHIM_CODE__: string = HMR_SHIM_SOURCE

/**
 * Reads Kirby's panel-vue URL at runtime from the page's
 * `<script type="importmap">` and dynamic-imports it; the browser's module
 * map dedups by URL, so plugin SFCs share Kirby's Vue instance (and
 * `__VUE_HMR_RUNTIME__`). Top-level await lets consumers keep using ordinary
 * `import { ... } from 'vue'` syntax.
 */
export function buildVueStubCode(namedExports: readonly string[]): string {
  if (namedExports.length === 0)
    return VUE_STUB_SOURCE

  const exportsDestructure = `\nexport const {\n${namedExports.map(name => `  ${name},`).join('\n')}\n} = __kirbyupVueModule\n`
  return VUE_STUB_SOURCE + exportsDestructure
}
