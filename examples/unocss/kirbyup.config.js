import { defineConfig } from 'kirbyup/config'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  vite: {
    plugins: [UnoCSS()],
  },
})
