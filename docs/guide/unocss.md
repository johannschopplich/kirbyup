# UnoCSS

[UnoCSS](https://unocss.dev/) is the recommended way to write utility classes in a Panel plugin. It runs as a Vite plugin, ships a Tailwind-compatible preset and lets you prefix every class so plugins do not collide.

The [`unocss` starter](https://github.com/johannschopplich/kirbyup/tree/main/examples/unocss) has all of this set up.

## Setup

::: code-group
```bash [pnpm]
pnpm add -D unocss
```
```bash [npm]
npm install -D unocss
```
:::

```js
// uno.config.js
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
```

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  vite: {
    plugins: [UnoCSS()],
  },
})
```

```js
// src/index.js
import 'virtual:uno.css'
```

## Why a Prefix

Kirby merges the CSS of every Panel plugin into one bundle. When two plugins both emit `.p-2`, the later one wins, and variants like `lg:p-2` silently break for the other. A prefix keeps each plugin's utilities in their own namespace:

```html
<div class="demo-p-2 demo-lg:p-4">
```

## Why `preflight: false`

The preset ships a CSS reset. Inside the Panel that reset would restyle Kirby's own UI, so keep it off.
