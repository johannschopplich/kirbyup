import { existsSync, unlinkSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { resolve } from 'pathe'
import type { Plugin, ResolvedConfig } from 'vite'
import type { PM } from 'detect-package-manager'
import { detect as detectPm } from 'detect-package-manager'
import type { ServeOptions } from '../types'
import { __INJECTED_HMR_CODE__, isHmrRuntimeId } from './utils'

// Proxy JS file to "forward" the plugin script loaded by Kirby to the Vite server
const getViteProxyModule = (entryUrl: string, pm: PM) => `
try {
  await import("${entryUrl}");
} catch (err) {
  console.error(
    "[kirbyup] Couldn't connect to the development server. Run \`${pm} run serve\` to start Vite or build the plugin with \`${pm} run build\` so Kirby uses the production version."
  );
  throw err;
}`.trim()

export default function kirbyupHmrPlugin(options: ServeOptions): Plugin {
  let config: ResolvedConfig
  let entry: string
  let indexMjs: string

  return {
    name: 'kirbyup:hmr',
    apply: 'serve',
    configResolved(resolvedConfig) {
      config = resolvedConfig
      entry = resolve(config.root, options.entry)
      indexMjs = resolve(config.root, options.outDir || '', 'index.dev.mjs')
    },
    transform(code, id) {
      if (isHmrRuntimeId(id)) {
        // Call $_applyKirbyModifications before instantiating the new component instance
        // and append our own runtime code *at the end*, so rerender & reload methods on the
        // __VUE_HMR_RUNTIME__ are already defined and can be wrapped.
        return (
          code.replace(
            // https://github.com/vitejs/vite-plugin-vue2/blob/06ede94/src/utils/hmrRuntime.ts#L173
            /^.*=\s*record\.Ctor\.super\.extend\(options\)/m,
            '$_applyKirbyModifications(record.Ctor.options, options) // injected by kirbyup\n$&',
          ) + __INJECTED_HMR_CODE__
        )
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

        const pm: PM = await detectPm().catch(() => 'npm')

        await writeFile(indexMjs, getViteProxyModule(entryUrl, pm))
      })
    },
    closeBundle() {
      if (existsSync(indexMjs))
        unlinkSync(indexMjs)
    },
  }
}
