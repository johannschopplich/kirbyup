# Auto-Import Blocks and Fields

::: warning
This feature might be removed in future versions of kirbyup. Consider using manual imports instead (see [Recommended Alternative](#recommended-alternative) below).
:::

If you find yourself in the situation of needing to import multiple **blocks** or **fields** into your Panel plugin, you can use the kirbyup `kirbyup.import` function to ease the process.

Instead of manually importing each block or field, you can use the `kirbyup.import` function to import all files that match a glob pattern.

Given the following Panel plugin:

```js
import Bar from './components/blocks/Bar.vue'
import Foo from './components/blocks/Foo.vue'
import Maps from './components/blocks/Maps.vue'

window.panel.plugin('kirbyup/example', {
  blocks: {
    foo: Foo,
    bar: Bar,
    maps: Maps
  }
})
```

You can use the `kirbyup.import` function to import all blocks at once:

```js
import { kirbyup } from 'kirbyup/plugin'

window.panel.plugin('kirbyup/example', {
  blocks: kirbyup.import('./components/blocks/*.vue')
})
```

## Recommended Alternative

For better tree-shaking, explicit dependencies, and IDE support, consider using manual imports:

```js
import Bar from './components/blocks/Bar.vue'
import Foo from './components/blocks/Foo.vue'
import Maps from './components/blocks/Maps.vue'

window.panel.plugin('my-plugin/blocks', {
  blocks: {
    foo: Foo,
    bar: Bar,
    maps: Maps
  }
})
```

::: tip
For plugins with many components, you can organize imports in a separate file:

```js
// src/components/blocks/index.js
export { default as Bar } from './Bar.vue'
export { default as Foo } from './Foo.vue'
export { default as Maps } from './Maps.vue'
```

```js
// src/index.js
import * as blocks from './components/blocks'

window.panel.plugin('my-plugin/blocks', {
  blocks
})
```
:::
