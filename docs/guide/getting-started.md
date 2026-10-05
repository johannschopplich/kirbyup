# Getting Started

kirbyup bundles a Kirby Panel plugin with Vite. One command builds for production, one starts a dev server with hot module replacement.

Your source lives in `src/`, split into as many files as you like. kirbyup turns it into the `index.js` and `index.css` in the plugin root, which are the two files Kirby loads.

## Prerequisites

- **Node.js 24 or newer** with pnpm, npm or yarn.
- **Kirby 6 or newer.** Kirby 6 runs the Panel on Vue 3, and kirbyup 4 builds for that runtime. Plugins for Kirby 4 and 5 stay on kirbyup 3.x, documented at the [last 3.x release](https://github.com/johannschopplich/kirbyup/tree/v3.5.0/docs).

Upgrading an existing plugin? Read the [migration guide](/guide/migration).

::: tip Starters
Skip the setup with one of the starters:

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
    "dev": "kirbyup dev src/index.js",
    "build": "kirbyup src/index.js"
  },
  "devDependencies": {
    "kirbyup": "^4.0.0"
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

<<< @/snippets/dev.ansi

The dev server writes `index.dev.js` next to your plugin. Kirby loads that file instead of `index.js` and pulls the plugin from the dev server. Edit a component and the Panel updates in place. Changes to PHP files reload the page. Stop the server and the file is removed.

Add `index.dev.js` to `.gitignore`.

::: details Watch mode without HMR
When the Panel cannot reach the dev server, for example on a remote host, rebuild on change instead:

```bash
kirbyup src/index.js --watch
```

<<< @/snippets/watch.ansi

Watch builds write an unminified `index.dev.js`, which Kirby picks up the same way.
:::

## Production

```bash
npm run build
```

<<< @/snippets/build.ansi

`index.js` and `index.css` land in the project root, minified. A leftover `index.dev.js` is removed so Kirby uses the production files.
