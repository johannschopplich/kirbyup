# Path Aliases

Import certain modules more easily by using the `~/` path alias. It will resolve to the directory of your input file, for example `src` when building `kirbyup src/index.js`.

For example, given the following directory structure:

```
.
├─ src
│  ├─ components
│  │  ├─ fields
│  │  │  └─ MyField.vue
│  └─ utils
│     └─ index.js
```

Instead of handling relative paths in a component located at `src/components/fields/MyField.vue` like this:

```js
import { myFunction } from '../../utils'
```

You can use the built-in path alias like this:

```js
import { myFunction } from '~/utils'
```

::: tip
The famous `@/` alias is supported as well and will resolve to the same directory as `~/`.
:::

## IDE Support

For proper IntelliSense in your editor, such as jump to definition, auto-completion for imports, and type checking (if using TypeScript), create a `jsconfig.json` (or `tsconfig.json` for TypeScript projects) in the root of your plugin:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "~/*": ["src/*"],
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"]
}
```

## Custom Aliases

You can define additional aliases in your `kirbyup.config.js`:

```js
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'kirbyup/config'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  alias: {
    '@components/': `${resolve(currentDir, 'src/components')}/`,
  },
})
```

::: warning
When using custom aliases, remember to update your `jsconfig.json` accordingly to maintain IDE support.
:::
