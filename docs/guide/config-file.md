# Extend Vite With `kirbyup.config.js`

Since kirbyup uses Vite under the hood, you might want to add Vite plugins or customize the Vite configuration. You can do this by creating a `kirbyup.config.js` or `kirbyup.config.ts` file in the root of your project:

```js
import { defineConfig } from 'kirbyup/config'

export default defineConfig({
  alias: {
    // Custom aliases
  },
  vite: {
    // Custom Vite options to be merged with the default config
  }
})
```

## Configuration Options

### `alias`

When aliasing to file system paths, always use absolute paths. Relative alias values will be used as-is and will not be resolved into file system paths.

### `vite`

You can build upon the defaults kirbup uses and extend the Vite configuration with custom plugins, etc.

For a complete list of options, take a look at the [Vite configuration options](https://vitejs.dev/config/).

## Example

A simple example of a `kirbyup.config.js` file to achieve the following:

- Set up an alias for the `#utils/` path to resolve to the `src/utils/` directory.
- Extend the Vite configuration with a custom `define` option. Vite will replace `__TEST__` with `true` if the environment variable `TEST` is set to `'true'`. This can be useful to tree-shake code based on the environment.

Could look like this:

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

::: tip
When using the `vite.define` option, you can use the `process.env` object to access environment variables. This is useful for tree-shaking code based on conditions.
:::

If you were to import a file from the `#utils/` path, it would resolve to the `src/utils/` directory:

```js
import { myUtil } from '#utils/myUtil.js'
```

The `__TEST__` global constant will be statically replaced during development and at build time:

```js
if (__TEST__)
  console.log('Running in test mode')
```

::: info

To pass the `TEST` environment variable to the Vite server or build command, you can prepend the kirbyup command with it:

```json{3}
{
  "scripts": {
    "dev": "TEST=true kirbyup serve src/index.js",
    "build": "kirbyup src/index.js"
  }
}
```

In this example, every if statement that checks for `__TEST__` will be removed from the production build.

:::
