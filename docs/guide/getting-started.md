# Getting Started

kirbyup bundles a Kirby Panel plugin with Vite. One command builds for production, one starts a dev server with hot module replacement.

Your source lives in `src/`, split into as many files as you like. kirbyup turns it into the `index.js` and `index.css` in the plugin root, which are the two files Kirby loads.

## Prerequisites

- **Node.js 22 or newer** with pnpm, npm or yarn.
- **Kirby 4 or newer.** Kirby 4 and 5 run the Panel on Vue 2, and kirbyup 3 builds for that runtime.

::: tip Starters
Skip the setup with one of the starters:

- [`pluginkit`](https://github.com/getkirby/pluginkit/tree/4-panel): Kirby's own starter.
- [`eslint`](https://github.com/johannschopplich/kirbyup/tree/main/examples/eslint): a section plugin with ESLint configured.
- [`unocss`](https://github.com/johannschopplich/kirbyup/tree/main/examples/unocss): the same, plus [UnoCSS](/guide/unocss) utilities.
:::

## Installation

::: code-group
```bash [pnpm]
pnpm add -D kirbyup
```
```bash [npm]
npm install -D kirbyup
```
```bash [yarn]
yarn add -D kirbyup
```
:::

Add the two scripts to `package.json`:

```json{3-4}
{
  "scripts": {
    "dev": "kirbyup serve src/index.js",
    "build": "kirbyup src/index.js"
  },
  "devDependencies": {
    "kirbyup": "^3.5.0"
  }
}
```

The entry file registers the plugin as usual:

```js
// src/index.js
import DemoSection from './components/DemoSection.vue'

window.panel.plugin('my/plugin', {
  sections: {
    demo: DemoSection,
  },
})
```

::: details Run without installing
`npx -y kirbyup src/index.js` works without a dependency. npx caches versions, so run `npx -y kirbyup@latest` when the output looks stale. A dev dependency avoids the issue.
:::

## Development

```bash
npm run dev
```

<<< @/snippets/serve.ansi

The dev server writes `index.dev.mjs` next to your plugin. Kirby loads that file instead of `index.js` and pulls the plugin from the dev server. Edit a component and the Panel updates in place. Changes to PHP files reload the page. Stop the server and the file is removed.

Add `index.dev.mjs` to `.gitignore`.

::: details Watch mode without HMR
When the Panel cannot reach the dev server, for example on a remote host, rebuild on change instead:

```bash
kirbyup src/index.js --watch
```

<<< @/snippets/watch.ansi

Watch builds write an unminified `index.js` in place of the production bundle.
:::

## Production

```bash
npm run build
```

<<< @/snippets/build.ansi

`index.js` and `index.css` land in the project root, minified. A leftover `index.dev.mjs` is removed so Kirby uses the production files.
