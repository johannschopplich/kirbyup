# kirbyuse

[kirbyuse](https://github.com/johannschopplich/kirbyuse) adds the Kirby-specific layer on top of Vue: types for `window.panel`, composables for common Panel tasks and prop sets for sections, fields and blocks.

::: info Versions
kirbyuse 2 pairs with kirbyup 4 and Kirby 6. Kirby 4 and 5 plugins use kirbyuse 1 with kirbyup 3.
:::

## Installation

::: code-group
```bash [pnpm]
pnpm add -D kirbyuse
```
```bash [npm]
npm install -D kirbyuse
```
```bash [yarn]
yarn add -D kirbyuse
```
:::

## Imports

Kirby 6 exposes `vue` through an import map, and kirbyup leaves `vue` out of the bundle. The Composition API comes from `vue`, everything Kirby-specific from `kirbyuse`:

<!-- eslint-skip -->

```js
import { computed, ref, usePanel, useSection } from 'kirbyuse' // [!code --]
import { usePanel, useSection } from 'kirbyuse' // [!code ++]
import { computed, ref } from 'vue' // [!code ++]
```

At runtime, `vue` resolves to the Panel's own copy. Your plugin and the Panel share one Vue.

## Panel Types

`usePanel` returns `window.panel` with types for every service:

```js
import { usePanel } from 'kirbyuse'

const panel = usePanel()

panel.notification.success('Saved')
panel.dialog.open({ /* ... */ })
panel.view.reload()
```

To type the global directly, import the package once in the entry file:

```js
// src/index.js
import 'kirbyuse'

window.panel.notification.success('Types work')
//           ^? (property) notification: PanelNotification
```

No TypeScript required, the hints work in JavaScript files as well.

## Composables

### `useSection`

Loads the section data Kirby prepared on the server. Together with the `section` prop set this is all a custom section needs:

```vue
<!-- src/components/DemoSection.vue -->
<script setup>
import { useSection } from 'kirbyuse'
import { section } from 'kirbyuse/props'
import { ref } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({ ...section })

const label = ref('')
const items = ref([])

const { load } = useSection()

async function loadSection() {
  const response = await load({
    parent: props.parent,
    name: props.name,
  })
  label.value = response.label
  items.value = response.items
}

loadSection()
</script>

<template>
  <k-section :label="label">
    <k-items :items="items" />
  </k-section>
</template>
```

### `useContent`

Reactive access to the content of the current view:

```js
import { useContent } from 'kirbyuse'
import { watch } from 'vue'

const { currentContent, contentChanges, hasChanges, update } = useContent()

watch(hasChanges, (changed) => {
  if (changed)
    console.log('Unsaved changes')
})

update({ title: 'New title' })
```

`currentContent` reflects the editor state including unsaved changes, `contentChanges` holds only the diff and `update` writes into it.

### `useDialog`

Opens Kirby's dialogs and resolves with the result:

```js
import { useDialog } from 'kirbyuse'

const { openTextDialog, openFieldsDialog } = useDialog()

const confirmed = await openTextDialog('Delete this entry?')

const result = await openFieldsDialog({
  fields: {
    email: { type: 'email', label: 'Email' },
  },
})
// result: { email: '...' } or undefined when cancelled
```

`openFieldsDialog` takes an `onSubmit` handler to validate before the dialog closes. Return `false` to keep it open.

### `useI18n`

Translates the objects Kirby uses for labels:

```js
import { useI18n } from 'kirbyuse'

const { t } = useI18n()

t({ en: 'Hello', de: 'Hallo' }) // Follows the Panel language
```

For Kirby's own translation strings, `panel.t()` is the right call.

### All Composables

| Composable | Returns |
| --- | --- |
| `usePanel` | The typed `window.panel` |
| `useApi` | `panel.api` for requests to the backend |
| `useApp` | `panel.app`, the Vue application instance |
| `useSection` | `{ load }` |
| `useContent` | `{ content, currentContent, contentChanges, hasChanges, update }` |
| `useDialog` | `{ openTextDialog, openFieldsDialog }` |
| `useBlock` | `{ field, open, update }` for custom block components |
| `useI18n` | `{ t }` |
| `useHelpers` | Kirby's `$helper` utilities |
| `useLibrary` | Kirby's `$library` bundle, such as dayjs |

## Prop Sets

`kirbyuse/props` exports the props Kirby passes to a component, so you spread them instead of copying them:

```js
import { field, section } from 'kirbyuse/props'

defineProps({ ...section })
```

The individual field props such as `label`, `disabled` and `required` are available as well.

## Plugin Assets

For assets that should load on demand, register them once and resolve them by file name:

| Helper | Purpose |
| --- | --- |
| `registerPluginAssets(assets)` | Registers `{ filename, url }` pairs, usually from a PHP-side asset list |
| `resolvePluginAsset(filename)` | Returns the registered asset |
| `loadPluginModule(filename)` | Imports a registered JavaScript module, cached |

- [kirbyuse on GitHub](https://github.com/johannschopplich/kirbyuse): every composable with examples.
- [Kirby Minimap](https://github.com/johannschopplich/kirby-minimap) and [Kirby SERP Preview](https://github.com/johannschopplich/kirby-serp-preview): plugins built with kirbyup and kirbyuse.
