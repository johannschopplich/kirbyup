# Getting Started

This guide will walk you through the steps to get started with `kirbyup`.

[[toc]]

## Prerequisites

Node.js and npm (or another package manager like pnpm) are required to use `kirbyup`.

::: tip
If you want to skip starting from scratch, pick one of the following starters:

- [`eslint`](https://github.com/johannschopplich/kirbyup/tree/main/examples/eslint)
- [`tailwindcss`](https://github.com/johannschopplich/kirbyup/tree/main/examples/tailwindcss)

These are recommended instead of [Kirby's default `pluginkit`](https://github.com/getkirby/pluginkit/tree/4-panel). They provide a better developer experience out of the box, like ESLint and Tailwind CSS.
:::

## Installation

Use a package manager of your choice to install `kirbyup` as a development dependency:

::: code-group
  ```bash [pnpm]
  pnpm add -D kirbyup
  ```
  ```bash [yarn]
  yarn add -D kirbyup
  ```
  ```bash [npm]
  npm install -D kirbyup
  ```
:::

Having installed kirbyup, you can add the following scripts as shortcuts to the commands you will use most often:

```json{3-4}
{
  "scripts": {
    "dev": "kirbyup serve src/index.js",
    "build": "kirbyup src/index.js"
  },
  "devDependencies": {
    "kirbyup": "^3.1.3"
  }
}
```

### Without the Installation Step

If you want to use kirbyup right away and don't want to track it as a dependency in your project, simply call it with `npx`:

```json{3-4}
{
  "scripts": {
    "dev": "npx -y kirbyup serve src/index.js",
    "build": "npx -y kirbyup src/index.js"
  }
}
```

::: info
`npx` may cache a certain version of kirbyup. If `npx` doesn't use the latest kirbyup version, run `npx -y kirbyup@latest` instead or delete the `~/.npm/_npx` cache folder.
Because of the caching, it's recommended to install kirbyup as a development dependency.
:::

## Usage

kirbyup provides a CLI to build and serve your Panel plugin. It uses Vite under the hood, so you can use all of Vite's features.

### Development

Start a development server for the Panel plugin:

```bash
npm run dev
# Which will run:
# kirbyup serve src/index.js
```

The terminal will output the port the server is running on, e.g. `5177`:

<<< @/snippets/serve.ansi

This creates `./index.dev.mjs`, telling Kirby to load the development version of the plugin from the dev server started by `kirbyup serve` when the Panel is opened. The serve command provides hot module replacement and auto-reload.

If you prefer the watch mode to build a development bundle of the final Panel plugin or develop in an older version of Kirby (prior to 3.7.4), run:

```bash
npx kirbyup src/index.js --watch
```

### Production

To compile the final Panel plugin for production, run:

```bash
npm run build
# Which will run:
# kirbyup src/index.js
```

The terminal will output the path to the bundled and minified plugin assets:

<<< @/snippets/build.ansi
