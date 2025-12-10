import type { AddressInfo } from 'node:net'
import type { PackageManager } from 'nypm'
import type { Plugin, ResolvedConfig } from 'vite'
import type { ServeOptions } from '../types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { detectPackageManager } from 'nypm'
import { resolve } from 'pathe'
import { __HMR_INJECTION_CODE__ } from './utils'

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
      // Vue 3 doesn't have a separate HMR runtime module. Instead, we inject our
      // wrapper code into each Vue component that has HMR enabled.
      if (!id.endsWith('.vue'))
        return
      if (!code.includes('__VUE_HMR_RUNTIME__.createRecord'))
        return

      // Find injection point: right before import.meta.hot.accept
      // This ensures our wrapper is set up before any HMR updates are accepted
      const injectionPoint = code.indexOf('import.meta.hot.accept')

      if (injectionPoint === -1)
        return

      // Inject wrapper code before the accept handler
      return {
        code: `${code.slice(0, injectionPoint) + __HMR_INJECTION_CODE__}\n${code.slice(injectionPoint)}`,
        map: null,
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
