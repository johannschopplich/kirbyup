import type { AddressInfo } from 'node:net'
import type { PackageManager } from 'nypm'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { ServeOptions } from '../types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { detectPackageManager } from 'nypm'
import { resolve } from 'pathe'
import { normalizePath } from 'vite'
import { ensureTrailingSlash, resolveOriginFromServerOptions } from '../utils/server'
import { __HMR_SHIM_CODE__, buildVueStubCode, extractEsmNamedExports } from './utils'

const SHIM_ID = '\0kirbyup:hmr-shim'
const SHIM_PUBLIC_ID = SHIM_ID.slice(1)
const VUE_STUB_ID = '\0kirbyup:vue-stub'
const VUE_STUB_PUBLIC_ID = VUE_STUB_ID.slice(1)

const VUE_NOT_FOUND_STUB = `throw new Error("[kirbyup] Cannot serve 'vue': failed to read node_modules/vue/dist/vue.esm-browser.js. Make sure 'vue' is installed in the plugin project.")\n`

export function kirbyupHmrPlugin(options: ServeOptions): Plugin {
  let config: ResolvedConfig
  let entry: string
  let entryId: string
  let devIndexPath: string
  let vueStubCode: string | undefined

  return {
    name: 'kirbyup:hmr',
    apply: 'serve',
    enforce: 'pre',

    config() {
      // Route every `import 'vue'` through our virtual stub. The stub runs in
      // the browser, reads Kirby's `<script type="importmap">` to find the
      // panel's vue URL, and dynamic-imports it – so plugin SFCs and Kirby's
      // own panel code share a single Vue module instance. Without this Vite
      // would resolve `vue` to the user's local `node_modules/vue`, producing
      // a parallel runtime with its own `__VUE_HMR_RUNTIME__` and breaking HMR.
      //
      // `optimizeDeps.exclude` keeps Vite's pre-bundler from scanning vue
      // before the alias has a chance to redirect it.
      return {
        optimizeDeps: { exclude: ['vue'] },
        resolve: {
          alias: [{ find: /^vue$/, replacement: VUE_STUB_ID }],
        },
      }
    },

    configResolved(resolvedConfig) {
      config = resolvedConfig
      entry = resolve(config.root, options.entry)
      entryId = normalizePath(entry)
      devIndexPath = resolve(config.root, options.outDir ?? '', 'index.dev.mjs')

      // Parse vue's exports once at startup. The bundle ships a single
      // trailing `export { ... }` block; we re-emit the same names through
      // the stub so SFC compiler output finds what it expects.
      try {
        const vuePath = resolve(config.root, 'node_modules/vue/dist/vue.esm-browser.js')
        const vueSource = fs.readFileSync(vuePath, 'utf8')
        const namedExports = extractEsmNamedExports(vueSource)
        vueStubCode = namedExports.length > 0 ? buildVueStubCode(namedExports) : undefined
      }
      catch {
        vueStubCode = undefined
      }
    },

    resolveId(source) {
      if (source === SHIM_ID || source === SHIM_PUBLIC_ID)
        return SHIM_ID
      if (source === VUE_STUB_ID || source === VUE_STUB_PUBLIC_ID)
        return VUE_STUB_ID
    },

    load(id) {
      if (id === SHIM_ID)
        return { code: __HMR_SHIM_CODE__, map: null }
      if (id === VUE_STUB_ID)
        return { code: vueStubCode ?? VUE_NOT_FOUND_STUB, map: null }
    },

    transform(code, id) {
      const cleanId = normalizePath(id.split('?')[0]!)
      if (cleanId !== entryId)
        return
      if (code.includes(SHIM_PUBLIC_ID))
        return

      return {
        code: `import ${JSON.stringify(SHIM_ID)}\n${code}`,
        map: null,
      }
    },

    configureServer(server) {
      if (!server.httpServer)
        return

      server.httpServer.once('listening', async () => {
        const entryPath = entry.replace(`${config.root}/`, '')
        const baseUrl = getDevBaseUrl(server, config)
        const entryUrl = new URL(entryPath, baseUrl).href
        const pm = await detectPackageManager(config.root)

        await fsp.writeFile(devIndexPath, getViteProxyModule(entryUrl, pm))
      })
    },

    async closeBundle() {
      await fsp.rm(devIndexPath, { force: true })
    },
  }
}

/**
 * Proxy the JS file to "forward" the plugin script loaded by Kirby to the Vite server
 */
function getViteProxyModule(entryUrl: string, packageManager?: PackageManager) {
  const pm = packageManager?.name || 'npm'

  return `
try {
  await import("${entryUrl}");
} catch (error) {
  console.error(
    "[kirbyup] Couldn't connect to the development server at ${entryUrl}. Run \`${pm} run serve\` to start Vite or build the plugin with \`${pm} run build\` so Kirby uses the production version."
  );
  throw error;
}
`.trimStart()
}

function getDevBaseUrl(
  server: ViteDevServer,
  config: ResolvedConfig,
): string {
  const { address, port } = server.httpServer!.address() as AddressInfo

  const origin
    = config.server?.origin
      ?? server.resolvedUrls?.local?.[0]
      ?? server.resolvedUrls?.network?.[0]
      ?? resolveOriginFromServerOptions(config.server, port, address)

  const normalizedOrigin = ensureTrailingSlash(origin)
  const base = config.base ?? '/'

  return new URL(base, normalizedOrigin).href
}
