# Path Aliases

Import certain modules more easily by using the `~/` path alias. It will resolve to the directory of your input file, for example `src` when building `kirbyup src/index.js`.

For example, given the following directory structure:

```
.
├─ src
│  ├─ components
│  │  └─ MyComponent.vue
│  └─ utils
│     └─ index.js
```

Instead of handling relative paths in a component located at `src/components/MyComponent.vue` like this:

```vue
<script>
import { myFunction } from '../utils'
</script>
```

You can use the built-in path alias like this:

```js
import { myFunction } from '~/utils'
```

::: tip
The famous `@/` alias is supported as well and will resolve to the same directory as `~/`.
:::
