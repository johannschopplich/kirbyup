# Getting Started

Get up and running with kirbyup in minutes.

[[toc]]

## Prerequisites

Node.js and npm (or another package manager like pnpm) are required to use `kirbyup`.

::: tip
If you want to skip starting from scratch, pick one of the following starters:

- [Kirby's default `pluginkit`](https://github.com/getkirby/pluginkit/tree/4-panel)
- [`pluginkit` + ESLint](https://github.com/johannschopplich/kirbyup/tree/main/examples/eslint)
- [`pluginkit` + Tailwind CSS](https://github.com/johannschopplich/kirbyup/tree/main/examples/tailwindcss)

The last two examples are based on the default `pluginkit` and include ESLint – it catches bugs early and helps you avoid common JavaScript and Vue pitfalls. The Tailwind CSS example also includes Tailwind CSS to style your Panel plugin.
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

After installation, add these scripts to your `package.json`:

```json{3-4}
{
  "scripts": {
    "dev": "kirbyup serve src/index.js",
    "build": "kirbyup src/index.js"
  },
  "devDependencies": {
    "kirbyup": "^3.4.0"
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

Your terminal shows the server port:

<<< @/snippets/serve.ansi

This creates `./index.dev.mjs`, which tells Kirby to load your plugin from the dev server. You get hot module replacement and auto-reload out of the box.

::: details Using watch mode instead?
If you prefer building a development bundle (without HMR) or need to support Kirby versions prior to 3.7.4, use watch mode:

```bash
npx kirbyup src/index.js --watch
```
:::

### Production

To compile the final Panel plugin for production, run:

```bash
npm run build
# Which will run:
# kirbyup src/index.js
```

Your terminal shows the bundled assets:

<<< @/snippets/build.ansi
