import { defineConfig } from 'vite'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  optimizeDeps: {
    exclude: [
      'vitepress',
    ],
  },
  server: {
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    // @ts-expect-error: Pinned Vite version inconsistency
    UnoCSS(),
  ],
})
