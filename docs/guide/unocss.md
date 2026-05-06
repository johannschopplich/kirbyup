# UnoCSS

Use [UnoCSS](https://unocss.dev/) for utility-first styling in Kirby Panel plugins. UnoCSS is the recommended utility-CSS solution for kirbyup-built plugins – it integrates as a Vite plugin (no PostCSS required), supports a Tailwind v3-compatible utility set via `presetWind3`, and gives you full control over class prefixing.

## Setup

**1. Install the dependency:**

::: code-group
```bash [pnpm]
pnpm add -D unocss
```
```bash [npm]
npm i -D unocss
```
:::

**2. Create `uno.config.js`:**

```js
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

**3. Register the Vite plugin in `kirbyup.config.js`:**

```js
import { defineConfig } from 'kirbyup/config'
import UnoCSS from 'unocss/vite'

export default defineConfig({
  vite: {
    plugins: [UnoCSS()],
  },
})
```

**4. Import the virtual stylesheet in your entry:**

```js
// src/index.js
import 'virtual:uno.css'
```

::: tip
Check out the [UnoCSS starter](https://github.com/johannschopplich/kirbyup/tree/main/examples/unocss) for a complete example.
:::

## Why a class prefix?

Kirby merges every Panel plugin's CSS into a single bundle. If two plugins both define `.p-2`, the second one wins – and the first plugin's `lg:p-2` quietly stops working.

Set a `prefix` per plugin to keep utilities in their own namespace:

```js
presetWind3({ prefix: 'demo-' })
```

Then prefix your classes in templates: `class="demo-p-2 demo-lg:p-4"`.

## Why `preflight: false`?

`presetWind3` ships a Tailwind-style preflight (CSS reset) by default. Inside the Kirby Panel, that reset would override the host application's styles and break unrelated UI. Disable it:

```js
presetWind3({ preflight: false })
```
