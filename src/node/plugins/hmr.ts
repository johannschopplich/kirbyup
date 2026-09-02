import type { AddressInfo } from 'node:net'
import type { Plugin, ResolvedConfig, ViteDevServer } from 'vite'
import type { ServeOptions } from '../types.ts'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { resolve } from 'node:path'
import { normalizePath } from 'vite'
import { resolveOriginFromServerOptions } from '../utils/server.ts'
import { __HMR_SHIM_CODE__, buildVueStubCode } from './utils.ts'

const SHIM_ID = '\0kirbyup:hmr-shim'
const SHIM_PUBLIC_ID = SHIM_ID.slice(1)
const VUE_STUB_ID = '\0kirbyup:vue-stub'
const VUE_STUB_PUBLIC_ID = VUE_STUB_ID.slice(1)

const VUE_NOT_FOUND_STUB = `throw new Error('[kirbyup] Cannot resolve "vue" from the plugin project. Make sure "vue" is installed as a dependency.')\n`

export interface KirbyupHmrApi {
  /**
   * Settles once `index.dev.js` is on disk. The file is written from the
   * server's `listening` handler, which nothing else awaits.
   */
  devIndexWritten: Promise<void>
}

export function kirbyupHmrPlugin(options: ServeOptions): Plugin {
  let config: ResolvedConfig
  let entry: string
  let entryId: string
  let devIndexPath: string
  let vueStubCode: string | undefined

  let markWritten: () => void
  let markFailed: (error: unknown) => void
  const devIndexWritten = new Promise<void>((resolve, reject) => {
    markWritten = resolve
    markFailed = reject
  })

  return {
    name: 'kirbyup:hmr',
    apply: 'serve',
    enforce: 'pre',

    api: { devIndexWritten } satisfies KirbyupHmrApi,

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

    async configResolved(resolvedConfig) {
      config = resolvedConfig
      entry = resolve(config.root, options.entry)
      entryId = normalizePath(entry)
      devIndexPath = resolve(config.root, options.outDir ?? '', 'index.dev.js')

      // Introspect Vue's named exports so the stub can re-emit them.
      try {
        const vueModule = await import('vue')
        const namedExports = Object.keys(vueModule).filter(
          // Skip CJS-interop keys like `module.exports` that aren't valid identifiers.
          name => name !== 'default' && /^[A-Z_$][\w$]*$/i.test(name),
        )
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
      // Middleware mode has no server to listen on, so no dev index is written.
      if (!server.httpServer) {
        markWritten()
        return
      }

      server.httpServer.once('listening', async () => {
        try {
          const entryPath = entry.replace(`${config.root}/`, '')
          const baseUrl = getDevBaseUrl(server, config)
          const entryUrl = new URL(entryPath, baseUrl).href
          const pm = detectPackageManager(config.root)

          await fsp.writeFile(devIndexPath, getViteProxyModule(entryUrl, pm))
          markWritten()
        }
        catch (error) {
          markFailed(error)
        }
      })
    },

    async closeBundle() {
      // Removing the file before the `listening` handler writes it would leave
      // Kirby loading a dev index that points at a server already gone.
      await devIndexWritten.catch(() => {})
      await fsp.rm(devIndexPath, { force: true })
    },
  }
}

function getViteProxyModule(entryUrl: string, packageManager: string) {
  // Kirby splices this module into the same concatenated bundle as every other
  // plugin, so rethrowing would abort evaluation and take the rest down with it.
  return `
try {
  await import("${entryUrl}");
} catch (error) {
  console.error(
    "[kirbyup] Couldn't connect to the development server at ${entryUrl}. Run \`${packageManager} run serve\` to start Vite or build the plugin with \`${packageManager} run build\` so Kirby uses the production version.",
    error
  );
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

  // Vite enforces `config.base` to start with `/`.
  const base = config.base ?? '/'
  return new URL(base, origin).href
}

function detectPackageManager(cwd: string): string {
  if (fs.existsSync(resolve(cwd, 'pnpm-lock.yaml')))
    return 'pnpm'
  if (fs.existsSync(resolve(cwd, 'bun.lock')) || fs.existsSync(resolve(cwd, 'bun.lockb')))
    return 'bun'
  if (fs.existsSync(resolve(cwd, 'yarn.lock')))
    return 'yarn'
  if (fs.existsSync(resolve(cwd, 'deno.lock')))
    return 'deno'
  return 'npm'
}
