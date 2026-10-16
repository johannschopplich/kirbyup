import type { UserConfig } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'
import UnpluginRaw from 'unplugin-raw/rolldown'

const config: UserConfig = defineConfig({
  entry: {
    'node/index': 'src/node/index.ts',
    'node/entry': 'src/node/entry.ts',
    'client/config': 'src/client/config.ts',
    'client/plugin': 'src/client/plugin.ts',
  },
  define: {
    'process.env.VITEST': 'undefined',
  },
  plugins: [UnpluginRaw()],
})

export default config
