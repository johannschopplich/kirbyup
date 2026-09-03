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

## IDE Support

The editor does not know the aliases. A `jsconfig.json` (or `tsconfig.json`) in the plugin root enables jump-to-definition and autocompletion:

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

Add more through the `alias` key of the [config file](/guide/config-file#add-aliases), and mirror them in `jsconfig.json`.
