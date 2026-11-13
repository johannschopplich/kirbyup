# Config File

kirbyup runs Vite with defaults that fit a Panel plugin. To add Vite plugins or change options, create `kirbyup.config.js` (or `.ts`) in the project root:

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  alias: {
    // Extra import aliases
  },
  vite: {
    // Vite options, merged into kirbyup's defaults
  },
})
```

`defineConfig` only adds types. Both keys are optional. The [config reference](/api/config) lists what they accept and which defaults kirbyup sets. For `alias`, see [Add Aliases](/guide/path-aliases#add-aliases).

Watch builds reload the file when it changes. The dev server reads it once, so restart after editing.

## Add a Vite Plugin

Plugins in `vite.plugins` are appended to kirbyup's own. This example polyfills Node.js built-ins for a library that expects them:

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  vite: {
    plugins: [nodePolyfills()],
  },
})
```

## Define Global Constants

Vite's `define` replaces identifiers at build time:

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  vite: {
    define: {
      __APP_VERSION__: JSON.stringify('1.0.0'),
    },
  },
})
```

```js
console.log(`Plugin version: ${__APP_VERSION__}`)
```

To branch on the build mode instead, use [`import.meta.env.DEV`](/guide/environment-variables).

## Fix `process is not defined`

A dependency that reads `process.env.NODE_ENV` works under `kirbyup dev` and throws `process is not defined` in the Panel once built, because only the dev server replaces it. Define the value yourself:

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  vite: {
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
    },
  },
})
```

## Change the Dev Server

`vite.server` configures Vite's dev server. `port` takes precedence over `--port`, and `origin` sets the URL Kirby loads the plugin from. Set `origin` when the Panel runs on another host or behind a proxy:

```js
// kirbyup.config.js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  vite: {
    server: {
      origin: 'https://plugin.example.test',
    },
  },
})
```
