# Extend Vite With `kirbyup.config.js`

Since kirbyup uses Vite under the hood, you might want to add Vite plugins or customize the Vite configuration. You can do this by creating a `kirbyup.config.js` or `kirbyup.config.ts` file in the root of your project:

```js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  // Your custom configuration
})
```

A simple example of a `kirbyup.config.js` file could look like this:

```js
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { defineConfig } from 'kirbyup/config'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  alias: {
    '#utils/': `${resolve(currentDir, 'src/utils')}/`
  },
  vite: {
    define: {
      __TEST__: JSON.stringify(process.env.TEST === 'true')
    }
  }
})
```

The configuration above does the following:

- It sets up an alias for the `#utils/` path to resolve to the `src/utils/` directory.
- It extends the Vite configuration with a custom `define` option. Vite will replace `__TEST__` with `true` if the environment variable `TEST` is set to `'true'`. This can be useful to tree-shake code based on the environment.

## Configuration Options

### `alias`

When aliasing to file system paths, always use absolute paths. Relative alias values will be used as-is and will not be resolved into file system paths.

### `vite`

You can build upon the defaults kirbup uses and extend the Vite configuration with custom plugins, etc.

For a complete list of options, take a look at the [Vite configuration options](https://vitejs.dev/config/).
