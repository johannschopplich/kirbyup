import type { ViteUserConfig } from 'vitest/config'
import { defineConfig } from 'vitest/config'

const config: ViteUserConfig = defineConfig({
  test: {
    globalSetup: ['./test/build.ts'],
  },
})

export default config
