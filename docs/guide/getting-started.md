# Getting Started

kirbyup bundles a Kirby Panel plugin with Vite. One command builds for production, one starts a dev server with hot module replacement.

Your source lives in `src/`, split into as many files as you like. kirbyup turns it into the `index.js` and `index.css` in the project root, which are the two files Kirby loads.

## Prerequisites

- **Node.js 24 or newer** with pnpm, npm or yarn.
- **Kirby 6.0.0-beta.4 or newer.** Kirby 6 runs the Panel on Vue 3, and kirbyup 4 builds for that runtime. Plugins for Kirby 4 and 5 stay on kirbyup 3.x, documented at [v3.kirbyup.getkirby.com](https://v3.kirbyup.getkirby.com).

Upgrading an existing plugin? Read the [migration guide](/guide/migration).

::: tip Starters
Skip the setup with one of the starters:

- [`eslint`](https://github.com/johannschopplich/kirbyup/tree/main/examples/eslint): a field plugin with ESLint configured.
- [`unocss`](https://github.com/johannschopplich/kirbyup/tree/main/examples/unocss): the same, plus [UnoCSS](/guide/unocss) utilities.
:::

## Install kirbyup

::: code-group
```bash [pnpm]
pnpm add -D kirbyup@next
```
```bash [npm]
npm install -D kirbyup@next
```
```bash [yarn]
yarn add -D kirbyup@next
```
:::

Add the two scripts to `package.json`:

```json{3-4}
{
  "scripts": {
    "dev": "kirbyup dev src/index.js",
    "build": "kirbyup src/index.js"
  }
}
```

::: details Run Without Installing
`npx -y kirbyup@next src/index.js` works without a dependency. npx caches versions, so run `npx -y kirbyup@next` when the output looks stale. A dev dependency avoids the issue.
:::

## Write the Entry File

The entry file registers the plugin as usual:

```js
// src/index.js
import DemoField from './components/DemoField.vue'

window.panel.plugin('my/plugin', {
  fields: {
    demo: DemoField,
  },
})
```

Import from `vue` as usual: kirbyup leaves it out of the bundle, and at runtime it resolves to the Panel's own copy, so your plugin and the Panel share one Vue.

Kirby loads the plugins one after another, so a top-level `await` in the entry file holds up the Panel until it settles. Keep slow work like a network request out of it.

A dynamic `import()` is bundled into `index.js`, as Kirby serves no other script for a plugin.

## Start the Dev Server

```bash
npm run dev
```

<<< @/snippets/dev.ansi

The dev server writes `index.dev.js` next to your plugin. Kirby loads that file instead of `index.js` and pulls the plugin from the dev server. Edit a component and the Panel updates in place. Changes to PHP files reload the page. Stop the server and the file is removed.

Add `index.dev.*` to `.gitignore`.

::: details Watch Mode Without HMR
When the Panel cannot reach the dev server, for example on a remote host, rebuild on change instead:

```bash
kirbyup src/index.js --watch
```

<<< @/snippets/watch.ansi

Watch builds write an unminified `index.dev.js` and `index.dev.css`, which Kirby picks up the same way. Your `index.css` stays as the last production build left it.
:::

## Build for Production

```bash
npm run build
```

<<< @/snippets/build.ansi

`index.js` and `index.css` land in the project root, minified. A leftover `index.dev.js` or `index.dev.css` is removed so Kirby uses the production files.
