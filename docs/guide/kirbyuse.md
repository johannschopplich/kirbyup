# kirbyuse Integration

[kirbyuse](https://github.com/johannschopplich/kirbyuse) provides Vue Composition utilities and TypeScript support for Kirby Panel plugins. It works seamlessly with kirbyup and is the recommended way to write Panel plugins using the Composition API.

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

Kirby uses Vue 2's UMD build, which means Composition API functions like `ref` and `computed` are not available as named exports. kirbyuse provides:

- **Composition API aliases**: Use `ref`, `computed`, `watch` etc. directly.
- **Type-safe Panel access**: IntelliSense for `window.panel` and its services.
- **Useful composables**: Ready-to-use utilities for common Panel operations.
- **Kirby 4 & 5 compatibility**: Works with both versions seamlessly.

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
import { useContent, watch } from 'kirbyuse'

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

::: tip
`useContent` is compatible with both Kirby 4 and Kirby 5. The returned getters and methods are automatically shimmed based on the Kirby version.
:::

### `useSection`

Load section data from the backend – essential for custom sections:

```vue
<script>
import { ref, useSection } from 'kirbyuse'
import { section } from 'kirbyuse/props'

const propsDefinition = { ...section }

export default {
  inheritAttrs: false,
}
</script>

<script setup>
const props = defineProps(propsDefinition)

const label = ref('')
const items = ref([])

const { load } = useSection()

// Load section data (async IIFE since Vue 2 doesn't support async setup)
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
import { computed, useBlock } from 'kirbyuse'

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
| `useContent` | Work with view content (Kirby 4 & 5 compatible) |
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
<script>
import { ref, useContent, usePanel, useSection, watch } from 'kirbyuse'
import { section } from 'kirbyuse/props'

const propsDefinition = { ...section }

export default {
  inheritAttrs: false,
}
</script>

<script setup>
const props = defineProps(propsDefinition)

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
