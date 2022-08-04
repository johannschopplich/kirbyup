import { existsSync, unlinkSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { resolve } from 'pathe'
import type { Plugin, ResolvedConfig } from 'vite'
import type { PM } from 'detect-package-manager'
import { detect as detectPm } from 'detect-package-manager'
import { parseVueRequest } from '@vitejs/plugin-vue2'
import type { ServeOptions } from '../types'

// Component reload (vs. refresh) doesn't work with Kirby so reload the page instead
const __HMR_CODE__ = `
if (typeof __VUE_HMR_RUNTIME__ !== 'undefined' && import.meta.hot) {
  __VUE_HMR_RUNTIME__.reload = () => import.meta.hot.invalidate();
}`.trim()

// Proxy JS file to "forward" the plugin script loaded by Kirby to the Vite server
const getViteProxyModule = (entryUrl: string, pm: PM) => `
try {
  await import("${entryUrl}");
} catch (err) {
  console.error(
    "[kirbyup] Couldn't connect to the development server. Run \`${pm} run dev\` to start Vite or build the plugin with \`${pm} run build\` so Kirby uses the production version."
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
      indexMjs = resolve(config.root, 'index.dev.mjs')
    },
    // Mirrors github.com/vitejs/vite-plugin-vue2/blob/d3d3a599f191bef5d6034993de92e2176e9577b3/src/index.ts#L156
    transform(code, id) {
      const { query } = parseVueRequest(id)

      if (query.raw)
        return

      if ((typeof id !== 'string' || /\0/.test(id)) && !query.vue)
        return

      if (/\.vue$/.test(id) && !query.vue)
        return `${code};${__HMR_CODE__}`
    },
    configureServer(server) {
      if (!server.httpServer)
        return

      server.httpServer.once('listening', async () => {
        const entryPath = entry.replace(`${config.root}/`, '')
        const { address, port } = server.httpServer!.address() as AddressInfo
        const baseUrl = `http://${address}:${port}${config.base}`
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
