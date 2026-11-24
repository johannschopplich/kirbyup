# Migration to v4

kirbyup 4 builds for Kirby 6 and its Vue 3 Panel. This page lists what changes for a plugin that runs on kirbyup 3. Kirby 4 and 5 stay on kirbyup 3.x, documented at [v3.kirbyup.getkirby.com](https://v3.kirbyup.getkirby.com).

::: info Kirby 6 and Your Components
The Panel moves from Vue 2 to Vue 3, and fields replace sections. Kirby's [upgrade guide for plugin developers](https://getkirby.com/docs/guide/updates/update-to-v6/plugin-developers) covers what that means for your components.
:::

## Checklist

1. Node.js 24 or newer and Kirby 6.
2. `pnpm add -D kirbyup@latest kirbyuse@latest`
3. Switch the `dev` script from `kirbyup serve` to `kirbyup dev`.
4. Replace `index.dev.mjs` with `index.dev.*` in `.gitignore`.
5. Import `ref`, `computed` and friends from `vue` instead of `kirbyuse`, and replace the [kirbyuse 2 removals](#kirbyuse-2-removals).
6. Replace `extendViteConfig` with `vite` in the config file.
7. Run the CLI instead of `import { build, serve } from 'kirbyup'`, which is gone.

## `serve` Is Now `dev`

`serve` still runs and prints a hint on every start. Switch the script to `dev` so the hint goes away:

```json
{
  "scripts": {
    "dev": "kirbyup dev src/index.js",
    "build": "kirbyup src/index.js"
  }
}
```

## Watch Paths Move to `--watch-path`

| kirbyup 3 | kirbyup 4 |
| --- | --- |
| `--watch src --watch assets` | `--watch-path src,assets` |
| `--watch "src/**/*.vue"` on a build | `--watch-path src` |

`--watch-path` on `build` takes files and folders, not glob patterns. Folders are watched recursively, and a pattern is rejected instead of watching nothing. On `dev`, patterns still work.

## `index.dev.mjs` Is Now `index.dev.js`

Update `.gitignore`:

```ini
# .gitignore
index.dev.*
```

## Watch Builds No Longer Overwrite `index.js`

Watch builds write `index.dev.js` and `index.dev.css` instead of `index.js` and `index.css`. Kirby prefers the dev files when they exist, and the next production build removes them.

## `extendViteConfig` Is Now `vite`

The `vite` key takes the same object:

<!-- eslint-skip -->

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  extendViteConfig: { // [!code --]
  vite: { // [!code ++]
    plugins: [],
  },
})
```

## Import the Composition API From `vue`

Kirby 6 exposes `vue` through an import map, and kirbyup 4 leaves `vue` out of the bundle. Import the Composition API from `vue`:

<!-- eslint-skip -->

```js
import { computed, ref, watch } from 'kirbyuse' // [!code --]
import { computed, ref, watch } from 'vue' // [!code ++]
```

`window.Vue` no longer exists in the Panel. Code that reached for it has to import from `vue` as well.

Import `vue` by name or as a namespace (`import * as Vue from 'vue'`). A default import builds but fails to load, as the Panel's Vue has no default export.

kirbyuse 2 drops the re-exports and keeps the Kirby-specific parts. See the [kirbyuse page](/guide/kirbyuse) for what remains.

## kirbyuse 2 Removals

kirbyuse 2 also drops these:

| kirbyuse 1 | kirbyuse 2 |
| --- | --- |
| `isKirby4()`, `isKirby5()` | Removed, kirbyuse 2 runs on Kirby 6 only |
| `useStore()` | `useContent()` |
| `useSection()` | Removed, Kirby 6 has no sections |
| `section` from `kirbyuse/props` | `field` |
| `globalVue` | `import * as Vue from 'vue'` |
| `kirbyuse/composables` | `kirbyuse` |
