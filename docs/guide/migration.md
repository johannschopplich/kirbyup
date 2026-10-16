# Migration to v4

kirbyup 4 builds for Kirby 6 and its Vue 3 Panel. This page lists what changes for a plugin that runs on kirbyup 3.

::: info Kirby 6 and your components
The Panel moves from Vue 2 to Vue 3, and fields replace sections. What that means for your components is Kirby's topic, not kirbyup's. See the [Kirby 6 release notes](https://getkirby.com/releases/6).
:::

<!-- TODO: point the link above at the Kirby 6 Panel migration page once it exists. -->

## Checklist

1. Node.js 24 or newer.
2. `pnpm add -D kirbyup@^4 kirbyuse@^2`
3. Rename the `serve` script to `dev`.
4. Replace `index.dev.mjs` with `index.dev.js` in `.gitignore`.
5. Import `ref`, `computed` and friends from `vue` instead of `kirbyuse`.
6. Replace `extendViteConfig` with `vite` in the config file.

The rest of this page explains each step.

## Requirements

kirbyup 4 requires Node.js 24 and Kirby 6.0.0-beta.1 or later. Kirby 4 and 5 stay on kirbyup 3.x, documented at [v3.kirbyup.getkirby.com](https://v3.kirbyup.getkirby.com).

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

Import `vue` by name or as a namespace (`import * as Vue from 'vue'`). A default import builds but fails to load, as the Panel's Vue has no default export.

kirbyuse 2 drops the re-exports and keeps the Kirby-specific parts. See the [kirbyuse page](/guide/kirbyuse) for what remains.

## Entry File

Kirby 6 imports each plugin's `index.js` as its own ES module, and kirbyup 4 builds one. The entry file can use top-level `await` and `export`, though Kirby reads no export.

Kirby loads the plugins one after another, so a top-level `await` holds up the Panel until it settles. Keep slow work like a network request out of it.

A dynamic `import()` is bundled into `index.js`, as Kirby serves no other script for a plugin.

## Styling

No change. Sass stays built in, PostCSS runs when a config file exists, and no default PostCSS plugins are applied since kirbyup 3.3.
