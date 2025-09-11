import type { UserConfig, UserConfigFn } from 'tsdown/config'
import { defineConfig } from 'tsdown/config'

const config: UserConfig | UserConfigFn = defineConfig({
  entry: [
    'src/node/index.ts',
    'src/node/cli.ts',
    'src/client/config.ts',
    'src/client/plugin.ts',
  ],
  external: ['rollup'],
  define: {
    'process.env.VITEST': 'undefined',
  },
  unbundle: true,
})

export default config
