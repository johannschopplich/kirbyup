# kirbyup

> Take a look into Kirby's [pluginkit](https://github.com/getkirby/pluginkit/tree/4-panel) repository for an example setup.

The fastest and leanest way to bundle your Kirby Panel plugins. No configuration necessary.

## Key Features

- 🍂 Lightweight, robust and tested
- ⚡️ Fast compilation with Vite/esbuild
- 🔍 Watch mode
- \*️⃣ `kirbyup.import` to [auto-import blocks & fields](#auto-import-blocks-and-fields)
- 🎒 [PostCSS support](#postcss)
- 🧭 [Path resolve aliases](#path-resolve-aliases)
- 🔌 [Env variables support](#env-variables)
- 🦔 [Extendable configuration with `kirbyup.config.js`](#extendable-configuration-with-kirbyupconfigjs)

## Requirements

- Node 14+ (Node 16 recommended)

> ℹ️ When using kirbyup with `npx`, **npm 7+** is required. Previous versions don't pass cli arguments to the package invoked. npm 7 is bundled from Node 16 onwards.

## Get Started Right Away

… With one of the following Panel plugin kits:

- [`eslint-and-prettier`](./examples/eslint-and-prettier) (recommended)
- [`tailwindcss`](./examples/tailwindcss)
- [Kirby's default `pluginkit`](https://github.com/getkirby/pluginkit/tree/4-panel)

## Installation

If you want to use kirbyup right away, there is no need to install it. Simply call it with `npx`:

```json
{
  "scripts": {
    "dev": "npx -y kirbyup src/index.js --watch",
    "build": "npx -y kirbyup src/index.js"
  }
}
```

> If `npx` doesn't use the latest kirbyup version, although it is available, run `npx -y kirbyup@latest` instead or delete the `~/.npm/_npx` cache folder.

While kirbyup will stay backwards compatible, exact build reproducibility may be of importance to you. If so, I recommend to target a specific package version, rather than using `npx`. Install kirbyup with a package manager of your choice locally to your project:

```bash
npm i kirbyup --save-dev
```

Example package configuration:

```json
{
  "scripts": {
    "dev": "kirbyup src/index.js --watch",
    "build": "kirbyup src/index.js"
  },
  "devDependencies": {
    "kirbyup": "latest"
  }
}
```

Global installation is supported as well, but not recommended.

## Usage

### Development

Rebuild the Panel plugin on any file changes:

```bash
kirbyup src/index.js --watch
```

You can also specify the directories to be watched. By default, if no path is specified, kirbyup watches the directory specified by the input file (`src` for the example above).

```bash
kirbyup src/index.js --watch src
```

You can specify more than a single directory:

```bash
kirbyup src/index.js --watch src --watch libs
```

### Production

```bash
kirbyup src/index.js
```

The final panel plugin will be bundled, minified, and written into the current directory as `./index.js`.

## Built-in Features

### PostCSS

If the project contains a valid PostCSS config (any format supported by [postcss-load-config](https://github.com/postcss/postcss-load-config), e.g. `postcss.config.js`), it will be automatically applied to all imported CSS.

If no configuration file is found, kirbyup will apply two PostCSS plugins which the Kirby Panel uses as well to let you embrace the same functionality within your Panel plugins. The following PostCSS transforms are applied by kirbyup:

- [postcss-logical](https://github.com/csstools/postcss-logical) lets you use logical, rather than physical, direction and dimension mappings in CSS, following the [CSS Logical Properties and Values](https://drafts.csswg.org/css-logical/) specification.
- [postcss-dir-pseudo-class](https://github.com/csstools/postcss-dir-pseudo-class) lets you style by directionality using the `:dir()` pseudo-class in CSS, following the [Selectors](https://www.w3.org/TR/selectors-4/#the-dir-pseudo) specification. It gives you the same syntax Kirby uses for full compatibility with RTL localizations of the Panel.

### Path Resolve Aliases

Import certain modules more easily by using the `~/` path alias. It will resolve to the directory of your input file, for example `src` when building `kirbyup src/index.js`.

Now, given a deeply nested component, instead of using relative paths when importing like so:

```js
// Inside deeply nested module
import someUtility from '../../utils'
```

You can use the alias:

```js
import someUtility from '~/utils'
```

> ℹ️ You can use `@/` as path alias as well.

### Auto-Import Blocks and Fields

If you find yourself in the situation of needing to import multiple **blocks** or **fields** into your Panel plugin, you can use the kirbyup `kirbyup.import` function to ease the process.

Before:

```js
import Foo from './components/blocks/Foo.vue'
import Bar from './components/blocks/Bar.vue'
import Maps from './components/blocks/Maps.vue'

window.panel.plugin('kirbyup/example', {
  blocks: {
    foo: Foo,
    bar: Bar,
    maps: Maps
  }
})
```

After:

```js
import { kirbyup } from 'kirbyup/plugin'

window.panel.plugin('kirbyup/example', {
  blocks: kirbyup.import('./components/blocks/*.vue')
})
```

### Env Variables

kirbyup exposes env variables on the special `import.meta.env` object. Some built-in variables are available in all cases:

- **`import.meta.env.MODE`**: {`development` | `production`} the mode kirbyup is running in.
- **`import.meta.env.PROD`**: {boolean} whether kirbyup is running in production.
- **`import.meta.env.DEV`**: {boolean} whether kirbyup is running in development (always the opposite of `import.meta.env.PROD`)

During production, these env variables are **statically replaced**. It is therefore necessary to always reference them using the full static string. For example, dynamic key access like `import.meta.env[key]` will not work.

#### `.env` Files

kirbyup (thanks to Vite) uses [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the following files in your plugin's root directory:

```
.env                # loaded in all cases
.env.local          # loaded in all cases, ignored by git
.env.[mode]         # only loaded in specified mode
.env.[mode].local   # only loaded in specified mode, ignored by git
```

Loaded env variables are also exposed to your source code via `import.meta.env`.

To prevent accidentally leaking env variables for distribution, only variables prefixed with `KIRBYUP_` or `VITE_` are exposed to your processed code. Take the following file as an example:

```
DB_PASSWORD=foobar
KIRBYUP_SOME_KEY=123
```

Only `KIRBYUP_SOME_KEY` will be exposed as `import.meta.env.VITE_SOME_KEY` to your plugin's source code, but `DB_PASSWORD` will not.

### Extendable Configuration With `kirbyup.config.js`

Create a `kirbyup.config.js` or `kirbyup.config.ts` configuration file the root-level of your project to customize kirbyup.

```js
import { resolve } from 'path'
import { defineConfig } from 'kirbyup'

export default defineConfig({
  alias: {
    '#deep/': `${resolve(__dirname, 'src/deep')}/`
  },
  extendViteConfig: {
    build: {
      lib: {
        name: 'myPlugin'
      }
    }
  }
})
```

#### `alias`

When aliasing to file system paths, always use absolute paths. Relative alias values will be used as-is and will not be resolved into file system paths.

#### `extendViteConfig`

You can build upon the defaults kirbup uses and extend the Vite configuration with custom plugins etc.

For a complete list of options, take a look at the [Vite configuration options](https://vitejs.dev/config/).

## Options

> Inspect all available options with `kirbyup --help`.

### `--out-dir`

The output directory to save the processed code into. Defaults to the current working directory.

### `--watch`

Sets the watch mode. If no path is specified, kirbyup watches the folder of the input file. Repeat `--watch` for multiple paths.

## Credits

- [Vite](https://vitejs.dev) by Evan You and all of its contributors.
- [EGOIST](https://github.com/egoist) for his inspirational work on [tsup](https://github.com/egoist/tsup).

## License

[MIT](./LICENSE) License © 2021-2022 [Johann Schopplich](https://github.com/johannschopplich)
