# Import From Panel

The [Panel source](https://github.com/getkirby/kirby/tree/main/panel/src) contains components, mixins and helpers you can reuse instead of copying them. An alias that points at a Kirby checkout makes them importable.

The Panel itself uses `@/` for its source root. Using the same alias keeps the Panel's internal imports working.

## Setup

Clone Kirby into the plugin folder:

```bash
git clone git@github.com:getkirby/kirby.git
```

Point `@/` at the Panel source in `kirbyup.config.js`:

```js
// kirbyup.config.js
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'kirbyup/config'

const currentDir = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  alias: {
    '@/': `${resolve(currentDir, 'kirby/panel/src')}/`,
  },
})
```

## Usage

Reuse the base field props in a custom field:

```js
import { props as FieldProps } from '@/components/Forms/Field.vue'
import { options } from '@/mixins/props.js'

export default {
  mixins: [FieldProps, options],
}
```

::: info
Styles of imported Panel components end up in your bundle, duplicating what the Panel already ships. There is no way to exclude them per path.
:::
