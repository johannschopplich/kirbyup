# kirbyuse

[kirbyuse](https://github.com/johannschopplich/kirbyuse) adds the Kirby-specific layer on top of Vue: types for `window.panel`, composables for common Panel tasks and prop sets for fields and blocks.

kirbyuse 2 pairs with kirbyup 4 and Kirby 6. Kirby 4 and 5 plugins use kirbyuse 1 with kirbyup 3.

## Installation

::: code-group
```bash [pnpm]
pnpm add -D kirbyuse@next
```
```bash [npm]
npm install -D kirbyuse@next
```
```bash [yarn]
yarn add -D kirbyuse@next
```
:::

## Imports

The Composition API comes from `vue`, everything Kirby-specific from `kirbyuse`:

```js
import { usePanel } from 'kirbyuse'
import { computed, ref } from 'vue'
```

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

`useContent` gives reactive access to the content of the current view:

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

The [kirbyuse API](https://github.com/johannschopplich/kirbyuse#api) documents every composable with an example, and the [README](https://github.com/johannschopplich/kirbyuse) covers loading plugin assets on demand.

## Prop Sets

`kirbyuse/props` exports the props Kirby passes to a component, so you spread them instead of copying them:

```js
import { field } from 'kirbyuse/props'

defineProps({ ...field })
```

The individual field props such as `label`, `disabled` and `required` are available as well.

[Kirby Minimap](https://github.com/johannschopplich/kirby-minimap), [Kirby Content Translator](https://github.com/kirby-tools/kirby-content-translator) and [Kirby SERP Preview](https://github.com/johannschopplich/kirby-serp-preview) are plugins built with kirbyup and kirbyuse.
