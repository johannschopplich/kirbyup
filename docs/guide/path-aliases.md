# Path Aliases

`~/` and `@/` resolve to the folder of the entry file. With `kirbyup src/index.js`, both point at `src`.

```text
.
├─ src
│  ├─ components
│  │  └─ fields
│  │     └─ MyField.vue
│  └─ utils
│     └─ index.js
```

Inside `src/components/fields/MyField.vue`:

<!-- eslint-skip -->

```js
import { myFunction } from '../../utils' // [!code --]
import { myFunction } from '~/utils' // [!code ++]
```

## Add Aliases

The `alias` key of the [config file](/guide/config-file) extends the built-in `~/` and `@/`. Use absolute paths for file system targets:

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

## IDE Support

The editor does not know the aliases. A `jsconfig.json` (or `tsconfig.json`) in the project root enables jump-to-definition and autocompletion. Mirror each alias you add:

<!-- eslint-skip -->

```json
{
  "compilerOptions": {
    "paths": {
      "~/*": ["./src/*"],
      "@/*": ["./src/*"],
      "@components/*": ["./src/components/*"], // [!code ++]
      "@utils/*": ["./src/utils/*"] // [!code ++]
    }
  },
  "include": ["src/**/*"]
}
```
