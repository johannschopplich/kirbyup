const __kirbyupVueImportMapEl = typeof document !== 'undefined'
  ? document.querySelector('script[type="importmap"]')
  : null
const __kirbyupVueImports = __kirbyupVueImportMapEl
  ? (() => {
      try { return JSON.parse(__kirbyupVueImportMapEl.textContent || '{}').imports || {} }
      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (_) { return {} }
    })()
  : {}
const __kirbyupVueUrl = __kirbyupVueImports.vue
if (!__kirbyupVueUrl) {
  throw new Error(
    '[kirbyup] No "vue" entry found in the page <script type="importmap">. Ensure Kirby\'s Panel is loaded with v6 import maps enabled.',
  )
}
// eslint-disable-next-line no-unused-vars, antfu/no-top-level-await
const __kirbyupVueModule = await import(/* @vite-ignore */ __kirbyupVueUrl)
