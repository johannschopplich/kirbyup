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

`defineConfig` only adds types. Both keys are optional. The [config reference](/api/config) lists what they accept and which defaults kirbyup sets.

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

## Add Aliases

`alias` extends the built-in `~/` and `@/`. Use absolute paths for file system targets:

```js
// kirbyup.config.js
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'kirbyup/config'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  alias: {
    '@components/': `${resolve(currentDir, 'src/components')}/`,
    '@utils/': `${resolve(currentDir, 'src/utils')}/`,
  },
})
```

```js
import MyField from '@components/fields/MyField.vue'
import { formatDate } from '@utils/helpers'
```

Mirror new aliases in `jsconfig.json` so the editor resolves them, see [Path Aliases](/guide/path-aliases#ide-support):

<!-- eslint-skip -->

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"],
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"], // [!code ++]
      "@utils/*": ["src/utils/*"] // [!code ++]
    }
  },
  "include": ["src/**/*"]
}
```

## Change the Dev Server

`vite.server` reaches Vite's dev server. `port` takes precedence over `--port`, and `origin` sets the URL Kirby loads the plugin from. Set `origin` when the Panel runs on another host or behind a proxy:

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
