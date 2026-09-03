# Auto-Imports

`kirbyup.import` registers every component that matches a glob pattern. Names come from the file name, lowercased: `Foo.vue` becomes `foo`, `MyBlock.vue` becomes `myblock`.

<!-- eslint-skip -->

```js
// src/index.js
import Bar from './components/blocks/Bar.vue' // [!code --]
import Foo from './components/blocks/Foo.vue' // [!code --]
import Maps from './components/blocks/Maps.vue' // [!code --]
import { kirbyup } from 'kirbyup/plugin' // [!code ++]

window.panel.plugin('my/plugin', {
  blocks: { // [!code --]
    bar: Bar, // [!code --]
    foo: Foo, // [!code --]
    maps: Maps, // [!code --]
  }, // [!code --]
  blocks: kirbyup.import('./components/blocks/*.vue'), // [!code ++]
})
```

The pattern is expanded at build time, so it has to be a string literal. See the [reference](/api/plugin#kirbyup-import-glob) for details.

## Trade-offs

Explicit imports are the better default for anything beyond a handful of components:

- **Tree-shaking**: the bundler can drop what is never registered.
- **Grep-ability**: `import` statements show what is used where.
- **Editor support**: jump-to-definition, rename and auto-import work on real imports.

A middle ground keeps the entry file short without a glob. Re-export the components from an index file:

```js
// src/components/blocks/index.js
export { default as bar } from './Bar.vue'
export { default as foo } from './Foo.vue'
export { default as maps } from './Maps.vue'
```

```js
// src/index.js
import * as blocks from './components/blocks'

window.panel.plugin('my/plugin', {
  blocks,
})
```
