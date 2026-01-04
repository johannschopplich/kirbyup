# Import From Panel Core

The [Kirby Panel](https://github.com/getkirby/kirby/tree/main/panel/src) ships with reusable components, mixins, and utilities you can use in your plugins – no need to copy code into your own project.

To reuse code from the Kirby Panel, you can create a [`kirbyup.config.js` config file](/guide/config-file) with a custom alias that points to the root source folder of Kirby. This way, you can import Kirby components by using a path alias.

::: tip
The `@/` alias is used throughout the Panel codebase. Using the same alias ensures all internal Panel references resolve correctly.
:::

## Setup

**1. Clone the Kirby repository** into your plugin folder:

```bash
git clone git@github.com:getkirby/kirby.git
```

**2. Create `kirbyup.config.js`** with an alias pointing to the Panel source:

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

## Usage

Now you can import directly from the Panel source. For example, reuse the base field props in your custom field:

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
