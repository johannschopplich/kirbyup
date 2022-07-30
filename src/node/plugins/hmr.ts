import { existsSync, unlinkSync } from 'node:fs'
import { writeFile } from 'node:fs/promises'
import type { AddressInfo } from 'node:net'
import { resolve } from 'pathe'
import type { Plugin, ResolvedConfig } from 'vite'
import { normalizePath } from 'vite'
import type { PM } from 'detect-package-manager'
import { detect as detectPm } from 'detect-package-manager'
import type { ResolvedCliOptions } from '../types'

const __HMR_ID__ = '\0kirbyup:hmr'

// Injected code to trigger full reloads for updates that aren't CSS
const __HMR_CODE__ = `
if (import.meta.hot) {
  import.meta.hot.on("vite:beforeUpdate", ({ updates }) => {
    if (updates.some((update) => !update.path.match(/type=style&index=\\d+/))) {
      import.meta.hot.invalidate();
    }
  });
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

export default function kirbyupHmrPlugin(options: ResolvedCliOptions): Plugin {
  const indexMjs = resolve(options.cwd, 'index.mjs')
  const entry = resolve(options.cwd, options.entry)

  let config: ResolvedConfig

  return {
    name: 'kirbyup:hmr',
    apply: 'serve',
    configResolved(resolvedConfig) {
      config = resolvedConfig
    },
    resolveId(id) {
      if (id === __HMR_ID__)
        return id
    },
    load(id) {
      if (id === __HMR_ID__)
        return __HMR_CODE__
    },
    transform(code, id) {
      if (id === normalizePath(entry))
        return `import '${__HMR_ID__}';${code}`

      return code
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
