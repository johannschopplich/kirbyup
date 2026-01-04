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
The `@/` alias is also supported and resolves to the same directory as `~/`.
:::

## IDE Support

Your editor doesn't know about kirbyup's aliases by default. To enable IntelliSense features like jump-to-definition and auto-completion, create a `jsconfig.json` (or `tsconfig.json` for TypeScript) in your plugin root:

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

Need more than `~/` and `@/`? Define additional aliases in your `kirbyup.config.js`:

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
