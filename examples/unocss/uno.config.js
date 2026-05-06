import { defineConfig, presetWind3 } from 'unocss'

export default defineConfig({
  presets: [
    presetWind3({
      prefix: 'demo-',
      preflight: false,
    }),
  ],
  content: {
    filesystem: ['src/**/*.vue'],
  },
})
