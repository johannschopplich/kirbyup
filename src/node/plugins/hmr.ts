import type { AddressInfo } from 'node:net'
import type { PackageManager } from 'nypm'
import type { Plugin, ResolvedConfig } from 'vite'
import type { ServeOptions } from '../types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { detectPackageManager } from 'nypm'
import { resolve } from 'pathe'
import { __INJECTED_HMR_CODE__, isHmrRuntimeId } from './utils'

export function kirbyupHmrPlugin(options: ServeOptions): Plugin {
  let config: ResolvedConfig
  let entry: string
  let devIndexPath: string

  return {
    name: 'kirbyup:hmr',
    apply: 'serve',

    configResolved(resolvedConfig) {
      config = resolvedConfig
      entry = resolve(config.root, options.entry)
      devIndexPath = resolve(config.root, options.outDir || '', 'index.dev.mjs')
    },

    transform(code, id) {
      if (isHmrRuntimeId(id)) {
        // Call `$_applyKirbyModifications` before instantiating the new component instance
        // and append our own runtime code *at the end*, so rerender & reload methods on the
        // `__VUE_HMR_RUNTIME__` are already defined and can be wrapped.
        return code.replace(
          // https://github.com/vitejs/vite-plugin-vue2/blob/8de73ea6b8a1df4c14308da2885db195dacc2b14/src/utils/hmrRuntime.ts#L173
          /^.*=\s*record\.Ctor\.super\.extend\(options\)/m,
          '$_applyKirbyModifications(record.Ctor.options, options) // injected by kirbyup\n$&',
        ) + __INJECTED_HMR_CODE__
      }
    },

    configureServer(server) {
      if (!server.httpServer)
        return

      server.httpServer.once('listening', async () => {
        const entryPath = entry.replace(`${config.root}/`, '')
        const { address, family, port } = server.httpServer!.address() as AddressInfo
        const hostname = family === 'IPv6' ? `[${address}]` : address
        const baseUrl = `http://${hostname}:${port}${config.base}`
        const entryUrl = new URL(entryPath, baseUrl).href
        const pm = await detectPackageManager(config.root)

        await fsp.writeFile(devIndexPath, getViteProxyModule(entryUrl, pm))
      })
    },

    closeBundle() {
      if (fs.existsSync(devIndexPath))
        fs.unlinkSync(devIndexPath)
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
} catch (err) {
  console.error(
    "[kirbyup] Couldn't connect to the development server. Run \`${pm} run serve\` to start Vite or build the plugin with \`${pm} run build\` so Kirby uses the production version."
  );
  throw err;
}
`.trimStart()
}
