# Migration to v4

kirbyup 4 builds for Kirby 6 and its Vue 3 Panel. This page lists what changes for a plugin that runs on kirbyup 3.

::: info Kirby 6 and your components
The Panel moves from Vue 2 to Vue 3. What that means for your components is Kirby's topic, not kirbyup's. See the [Kirby 6 release notes](https://getkirby.com/releases/6).
:::

<!-- TODO: point the link above at the Kirby 6 Panel migration page once it exists. -->

## Checklist

1. Node.js 24 or newer.
2. `pnpm add -D kirbyup@^4 kirbyuse@^2`
3. Rename the `serve` script to `dev`.
4. Replace `index.dev.mjs` with `index.dev.js` in `.gitignore`.
5. Import `ref`, `computed` and friends from `vue` instead of `kirbyuse`.
6. Replace `extendViteConfig` with `vite` in the config file.
7. Remove top-level `await` and `export` from the entry file.

The rest of this page explains each step.

## Requirements

kirbyup 4 requires Node.js 24 and Kirby 6. Kirby 4 and 5 stay on kirbyup 3.x, documented at the [last 3.x release](https://github.com/johannschopplich/kirbyup/tree/v3.5.0/docs).

## CLI

| kirbyup 3 | kirbyup 4 |
| --- | --- |
| `kirbyup serve src/index.js` | `kirbyup dev src/index.js` |
| `--watch src --watch assets` | `--watch-path src,assets` |
| `--watch "src/**/*.vue"` on a build | `--watch-path src` |

`serve` still runs and prints a hint on every start. Rename the script so the hint goes away:

```json
{
  "scripts": {
    "dev": "kirbyup dev src/index.js",
    "build": "kirbyup src/index.js"
  }
}
```

`--watch-path` on `build` takes files and folders, not glob patterns. Folders are watched recursively, and a pattern is rejected instead of watching nothing. On `dev`, patterns still work.

## Output Files

`index.dev.mjs` is now `index.dev.js`. Update `.gitignore`:

```ini
# .gitignore
index.dev.js
```

Watch builds write to `index.dev.js` as well, not to `index.js`. Kirby prefers the dev file when it exists, and the next production build removes it.

## Config File

`extendViteConfig` is gone. The `vite` key takes the same object:

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

## Vue Imports

Kirby 6 exposes `vue` through an import map, and kirbyup 4 leaves `vue` out of the bundle. Import the Composition API from `vue`:

<!-- eslint-skip -->

```js
import { computed, ref, watch } from 'kirbyuse' // [!code --]
import { computed, ref, watch } from 'vue' // [!code ++]
```

`window.Vue` no longer exists in the Panel. Code that reached for it has to import from `vue` as well.

kirbyuse 2 drops the re-exports and keeps the Kirby-specific parts. See the [kirbyuse page](/guide/kirbyuse) for what remains.

## Entry File

Kirby 6 concatenates every plugin's `index.js` into one module. kirbyup therefore wraps the bundle in an IIFE, which adds no top-level names that could collide with another plugin. Two things stop working in the entry file:

- **Top-level `await`.** Move it into an async function.
- **`export`.** Kirby loads plugins for their side effects only, so nothing reads an export anyway.

Both fail the build with a clear message rather than breaking the Panel at runtime.

## Styling

No change. Sass stays built in, PostCSS runs when a config file exists, and no default PostCSS plugins are applied since kirbyup 3.3.
