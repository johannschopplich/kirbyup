# Auto-Import Blocks and Fields

::: warn
This feature might be removed in future versions of kirbyup.
:::

If you find yourself in the situation of needing to import multiple **blocks** or **fields** into your Panel plugin, you can use the kirbyup `kirbyup.import` function to ease the process.

Instead of manually importing each block or field, you can use the `kirbyup.import` function to import all files that match a glob pattern.

Given the following Panel plugin:

```js
import Foo from './components/blocks/Foo.vue'
import Bar from './components/blocks/Bar.vue'
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
