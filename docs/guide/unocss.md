# UnoCSS

[UnoCSS](https://unocss.dev/) is the recommended way to write utility classes in a Panel plugin. It runs as a Vite plugin, ships a Tailwind-compatible preset and lets you prefix every class so plugins do not collide.

The [`unocss` starter](https://github.com/johannschopplich/kirbyup/tree/main/examples/unocss) has all of this set up.

## Set Up UnoCSS

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

Kirby loads the stylesheet of every Panel plugin into the same document. When two plugins both emit `.p-2`, the later one wins, and variants like `lg:p-2` silently break for the other. A prefix keeps each plugin's utilities in their own namespace:

```html
<div class="demo-p-2 lg:demo-p-4">
```

A variant goes before the prefix: `demo-lg:p-4` generates nothing.

## Why `preflight: false`

The preflight declares the `--un-*` custom properties on every element, which in the Panel includes Kirby's own UI. `false` keeps it out, but the transform, shadow, ring and filter utilities read those properties, so `demo-shadow` then draws no shadow. If you use them, set `preflight: 'on-demand'`, which declares only the properties your classes read.
