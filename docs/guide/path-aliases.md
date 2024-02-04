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
