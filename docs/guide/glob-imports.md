# Auto-Import Blocks and Fields

When you have multiple **blocks** or **fields** to import, the `kirbyup.import` helper imports all files matching a glob pattern in one call.

Component names are derived from each file's basename, lowercased: `Foo.vue` registers as `foo`, `MyBlock.vue` as `myblock`.

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

## Trade-offs

The convenience comes at a cost. For non-trivial plugins, manual imports are usually the better choice:

- **Better tree-shaking**: Bundlers can drop unused components.
- **Explicit dependencies**: A grep across `import` statements shows exactly what's used where.
- **IDE support**: Jump-to-definition, rename refactors, and auto-import all work on real `import` statements.

For a handful of blocks registered once, `kirbyup.import` is fine. For anything bigger – or anything you'll maintain over years – write the imports out by hand:

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
