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
- Extend the Vite configuration with a custom `define` option. Vite will replace `__PLAYGROUND__` with `true` if the environment variable `PLAYGROUND` is set to `'true'`. This can be useful to tree-shake code based on the environment.

::: tip
Don't use `define` to target build environments, like `development` or `production`. Instead, use [`import.meta.env.DEV` and `import.meta.env.PROD`](/guide/environment-variables) to conditionally execute code.
:::

The requirements above can be written in a configuration file like this:

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
    // `process.env` lets you access environment variables at build time
    define: {
      __PLAYGROUND__: JSON.stringify(process.env.PLAYGROUND === 'true')
    }
  }
})
```

If you were to import a file from the `#utils/` path, it would resolve to the `src/utils/` directory:

```js
import { myUtil } from '#utils/myUtil.js'
```

The `__PLAYGROUND__` global constant will be statically replaced during development and at build time. You can use it to conditionally execute code, like bundling the same plugin for different Kirby instances:

```js
if (__PLAYGROUND__)
  console.log('This Kirby site is the playground!')
```

::: info

To pass the `PLAYGROUND` environment variable to the Vite server or build command, you can prepend the kirbyup command with it:

```json{3}
{
  "scripts": {
    "dev": "PLAYGROUND=true kirbyup serve src/index.js",
    "build": "kirbyup src/index.js"
  }
}
```

In this example, every if statement that checks for `__PLAYGROUND__` will be removed from the production build.

:::
