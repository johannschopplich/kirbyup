# Plugin Helpers

`kirbyup/plugin` exports helpers for the plugin entry file. They run in the browser and are bundled with the plugin.

## `kirbyup.import(glob)`

Registers every file that matches `glob`, keyed by the lowercased file name without extension. `Foo.vue` becomes `foo`, `MyBlock.vue` becomes `myblock`.

```js
// src/index.js
import { kirbyup } from 'kirbyup/plugin'

window.panel.plugin('my/plugin', {
  blocks: kirbyup.import('./components/blocks/*.vue'),
})
```

`glob` must be a string literal, relative to the file that calls it. At build time the call is rewritten to `import.meta.glob(glob, { eager: true })`, so every matching file ends up in the bundle. A dynamic string is not expanded.

See [Auto-Imports](/guide/glob-imports) for when explicit imports are the better choice.
