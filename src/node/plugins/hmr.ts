import type { AddressInfo } from 'node:net'
import type { PackageManager } from 'nypm'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { ServeOptions } from '../types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { detectPackageManager } from 'nypm'
import { resolve } from 'pathe'
import { normalizePath } from 'vite'
import { ensureTrailingSlash, resolveOriginFromServerOptions } from '../utils/server'
import { __HMR_SHIM_CODE__, buildVueStubCode, extractEsmNamedExports } from './utils'

const SHIM_ID = '\0kirbyup:hmr-shim'
const SHIM_PUBLIC_ID = SHIM_ID.slice(1)
const VUE_STUB_ID = '\0kirbyup:vue-stub'
const VUE_STUB_PUBLIC_ID = VUE_STUB_ID.slice(1)

const VUE_NOT_FOUND_STUB = `throw new Error('[kirbyup] Cannot resolve "vue/dist/vue.esm-browser.js" from the plugin project. Make sure "vue" is installed as a dependency.')\n`

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
      // Route `vue` through the stub so plugin SFCs share Kirby's panel Vue;
      // a parallel local copy would split `__VUE_HMR_RUNTIME__` and break HMR.
      // `optimizeDeps.exclude` stops the pre-bundler from circumventing the alias.
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
      devIndexPath = resolve(config.root, options.outDir ?? '', 'index.dev.js')

      // Parse vue's named exports so the stub can re-emit them.
      try {
        const vueUrl = import.meta.resolve(
          'vue/dist/vue.esm-browser.js',
          pathToFileURL(`${config.root}/_`).href,
        )
        const vueSource = fs.readFileSync(fileURLToPath(vueUrl), 'utf8')
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
        return { code: __HMR_SHIM_CODE__, map: null, moduleType: 'js' }
      if (id === VUE_STUB_ID)
        return { code: vueStubCode ?? VUE_NOT_FOUND_STUB, map: null, moduleType: 'js' }
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

  const origin = config.server?.origin
    ?? server.resolvedUrls?.local?.[0]
    ?? server.resolvedUrls?.network?.[0]
    ?? resolveOriginFromServerOptions(config.server, port, address)

  const normalizedOrigin = ensureTrailingSlash(origin)
  const base = config.base ?? '/'

  return new URL(base, normalizedOrigin).href
}
