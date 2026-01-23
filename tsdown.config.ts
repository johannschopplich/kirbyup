import type { UserConfig } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfig = defineConfig({
  entry: {
    'node/index': 'src/node/index.ts',
    'node/cli': 'src/node/cli.ts',
    'client/config': 'src/client/config.ts',
    'client/plugin': 'src/client/plugin.ts',
  },
  external: ['rollup'],
  define: {
    'process.env.VITEST': 'undefined',
  },
})

export default config
