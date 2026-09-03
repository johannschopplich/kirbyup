# Config

`kirbyup.config.js` in the project root configures both the build and `serve`. The file is loaded with [c12](https://github.com/unjs/c12), so `.ts`, `.mjs` and `.js` all work. Neither `.kirbyuprc` nor a `package.json` key is read.

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  alias: {},
  vite: {},
})
```

## `defineConfig(config)`

Returns `config` unchanged. It exists for type hints and autocompletion.

## `alias`

- **Type:** [`AliasOptions`](https://vite.dev/config/shared-options.html#resolve-alias) from Vite

Extra import aliases, merged after the built-in `~/` and `@/`. An object maps a prefix to a replacement, an array of `{ find, replacement }` entries allows regular expressions. Entries apply in order, the first match wins.

Absolute paths resolve on the file system. Relative values are passed through as written, which is rarely what you want.

## `vite`

- **Type:** [`InlineConfig`](https://vite.dev/config/) from Vite

Merged into kirbyup's own config with Vite's `mergeConfig`. Arrays such as `plugins` are appended, everything else overrides.

kirbyup sets these options. Overriding the ones marked as fixed breaks the output.

| Option | kirbyup default | Notes |
| --- | --- | --- |
| `resolve.alias` | `~/` and `@/` to the entry file's folder | Extend via `alias` |
| `plugins` | Vue, Vue JSX, auto-imports, `vue` mapped to the Panel's global | Yours are appended |
| `envPrefix` | `['VITE_', 'KIRBYUP_']` | See [Env Variables](/guide/environment-variables) |
| `css.postcss` | Loaded from a PostCSS config file | See [PostCSS](/guide/postcss) |
| `build.lib` | IIFE from the entry file | Fixed |
| `build.minify` | `true` for production, `false` for watch builds | |
| `server.port` | `--port`, default `5177` | Config wins over the flag |
| `server.origin` | Derived from `server.host`, `server.https` and the port | The URL written into `index.dev.mjs` |
| `server.strictPort` | `true` | Fails instead of picking another port |

Set `server.origin` when the Panel cannot reach the dev server under the derived URL, for example on another host or behind a proxy.
