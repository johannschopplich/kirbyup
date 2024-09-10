# Import From Panel Core

The [Kirby Panel](https://github.com/getkirby/kirby/tree/main/panel/src) is well-written modular code that provides a lot of reusable components, mixins and utilities. You may want to use some of them, e.g. common section props, instead of copying the code into your own project.

To reuse code from the Kirby Panel, you can create a [`kirbyup.config.js` config file](/guide/config-file) with a custom alias that points to the root source folder of Kirby. This way, you can import Kirby components by using a path alias.

::: tip
The `@/` path resolve alias is used across the code base of the Panel. When using the same alias, references in the Kirby Panel source code will be resolved correctly.
:::

Clone the Kirby repository into a folder called `kirby` in the root of your Panel plugin:

```bash
git clone git@github.com:getkirby/kirby.git
```

Then, create a `kirbyup.config.js` in the root of your Panel plugin and define a custom alias that points to the Kirby Panel source folder:

```js
// `kirbyup.config.js`
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'kirbyup/config'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  alias: {
    '@/': `${resolve(currentDir, 'kirby/panel/src')}/`
  }
})
```

Any part of your Panel plugin can now import from the Kirby Panel source. For example, let's import some props from the Kirby base field component. The Panel itself uses imports like `@/components/Forms/Field.vue` all the time. And you can do the same in your Vue component's `<script>` section:

```js
import { props as FieldProps } from '@/components/Forms/Field.vue'
import { options } from '@/mixins/props.js'

export default {
  mixins: [FieldProps, options],
  // ...
}
```

::: info
The styles defined in Panel core components will be included in your build, resulting in duplicated styles. At the moment, there is no way to exclude component styles for certain paths.
:::
