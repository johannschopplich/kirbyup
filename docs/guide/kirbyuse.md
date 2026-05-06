# kirbyuse Integration

[kirbyuse](https://github.com/johannschopplich/kirbyuse) provides Vue Composition utilities and Panel type hints for Kirby Panel plugins. It is the recommended companion to kirbyup.

::: info
`kirbyuse` 2.x targets Kirby 6+ and the Vue 3-based Panel runtime, paired with kirbyup 4.x. For Kirby 4 or 5 plugins, use `kirbyuse` 1.x with kirbyup 3.x.
:::

## Installation

::: code-group
```bash [pnpm]
pnpm add -D kirbyuse
```
```bash [npm]
npm i -D kirbyuse
```
```bash [yarn]
yarn add -D kirbyuse
```
:::

## Why kirbyuse?

Kirby 6 ships the Panel as native Vue 3 with an import map. kirbyup 4.x externalizes `vue`, so plugins share the Panel's runtime. kirbyuse layers Kirby-specific ergonomics on top:

- **Type-safe Panel access**: IntelliSense for `window.panel` and its services.
- **Composables**: Ready-to-use utilities for common Panel operations (`usePanel`, `useSection`, `useDialog`, …).
- **Props helpers**: Pre-defined prop sets for sections, blocks, and fields.

## Imports

Import the Composition API directly from `vue`:

```js
import { computed, ref, watch } from 'vue'
```

kirbyup externalizes `vue`, so these imports resolve to Kirby's shared Vue runtime at load time – no extra setup required. Use `kirbyuse` for everything Kirby-specific:

```js
import { usePanel, useSection } from 'kirbyuse'
```

## Key Composables

### `usePanel`

Access the typed Kirby Panel object with full IntelliSense support:

```js
import { usePanel } from 'kirbyuse'

const panel = usePanel()

// All panel services are typed
panel.notification.success('Saved!')
panel.dialog.open({ /* ... */ })
panel.view.reload()
```

### `useContent`

Work with content of the current Panel view reactively:

```vue
<script setup>
import { useContent } from 'kirbyuse'
import { watch } from 'vue'

const { currentContent, contentChanges, hasChanges, update } = useContent()

// Watch for content changes
watch(currentContent, (newContent) => {
  console.log('Content updated:', newContent)
})

// Update content programmatically
function updateTitle() {
  update({ title: 'New Title' })
}
</script>
```

### `useSection`

Load section data from the backend – essential for custom sections:

```vue
<script setup>
import { useSection } from 'kirbyuse'
import { section } from 'kirbyuse/props'
import { ref } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({ ...section })

const label = ref('')
const items = ref([])

const { load } = useSection()

// Load section data immediately
;(async () => {
  const response = await load({
    parent: props.parent,
    name: props.name,
  })

  label.value = response.label
  items.value = response.items
})()
</script>

<template>
  <k-section :label="label">
    <!-- Section content -->
  </k-section>
</template>
```

### `useBlock`

Build custom block components with access to field configuration:

```vue
<script setup>
import { useBlock } from 'kirbyuse'
import { computed } from 'vue'

const props = defineProps({
  content: Object,
  endpoints: Object,
  fieldset: Object,
  id: String,
  name: String,
})

const emit = defineEmits(['update'])

const { field, open, update } = useBlock(props, emit)

// Access field options from the blueprint
const captionMarks = computed(() => field('caption', { marks: true }).marks)

// Update block content
function updateCaption(value) {
  update({ caption: value })
}
</script>
```

## Type Augmentation

Import kirbyuse once in your entry file to enable global type hints for `window.panel`:

```js
// src/index.js
import 'kirbyuse'

// Now window.panel has full IntelliSense support
window.panel.notification.success('Types work!')
//          ^? (property) notification: PanelNotification
```

This works in both JavaScript and TypeScript files – no additional configuration required.

## All Composables

| Composable | Description |
|------------|-------------|
| `usePanel` | Access the reactive Panel object |
| `useContent` | Work with view content |
| `useSection` | Load section data |
| `useBlock` | Block component utilities |
| `useDialog` | Open text and field dialogs |
| `useI18n` | Translation utilities |
| `useApi` | Panel API client (`window.panel.api`) |
| `useApp` | Vue instance (`window.panel.app`) |
| `useHelpers` | Internal Fiber helpers |
| `useLibrary` | Internal libraries (dayjs, colors) |

## Example: Custom Section

Here's a complete example of a custom Panel section using kirbyuse:

```vue
<script setup>
import { useContent, usePanel, useSection } from 'kirbyuse'
import { section } from 'kirbyuse/props'
import { ref, watch } from 'vue'

defineOptions({
  inheritAttrs: false,
})

const props = defineProps({ ...section })

const label = ref('')
const { currentContent, hasChanges } = useContent()
const { load } = useSection()

// Load section configuration
;(async () => {
  const response = await load({
    parent: props.parent,
    name: props.name,
  })
  label.value = response.label || 'My Section'
})()

// React to content changes
watch(hasChanges, (changed) => {
  if (changed) {
    console.log('Unsaved changes detected')
  }
})

function showNotification() {
  const panel = usePanel()
  panel.notification.success('Hello from kirbyuse!')
}
</script>

<template>
  <k-section :label="label">
    <k-button @click="showNotification">
      Click me
    </k-button>
  </k-section>
</template>
```

## More Resources

- [kirbyuse Repository](https://github.com/johannschopplich/kirbyuse) – Full documentation and API reference
- [Kirby Minimap](https://github.com/johannschopplich/kirby-minimap) – Example plugin using kirbyuse
- [Kirby SERP Preview](https://github.com/johannschopplich/kirby-serp-preview) – Another plugin built with kirbyuse
