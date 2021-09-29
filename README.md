# kirbyup

> Take a look into Kirby's [pluginkit](https://github.com/getkirby/pluginkit/tree/4-panel) repository for an example setup.

The fastest and leanest way to bundle your Kirby Panel plugins. No configuration necessary.

## Key Features

- 🍂 Lightweight, robust and tested
- ⚡️ Fast compilation with Vite/esbuild
- 🔌 [Supports env variables](#env-variables)
- 🔍 Watch mode

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
    "kirbyup": "^0.11.1"
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

### Env Variables

kirbyup exposes env variables on the special `import.meta.env` object. Some built-in variables are available in all cases:

- **`import.meta.env.MODE`**: {"development" | "production"} the mode kirbyup is running in.
- **`import.meta.env.PROD`**: {boolean} whether kirbyup is running in production.
- **`import.meta.env.DEV`**: {boolean} whether kirbyup is running in development (always the opposite of `import.meta.env.PROD`)

During production, these env variables are **statically replaced**. It is therefore necessary to always reference them using the full static string. For example, dynamic key access like `import.meta.env[key]` will not work.

#### `.env` Files

kirbyup (thanks to Vite) uses [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the following files in your [environment directory](/config/#envdir):

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

## Credits

- [Vite](https://vitejs.dev) by Evan You and all of its contributors.
- [EGOIST](https://github.com/egoist) for his inspirational work on [tsup](https://github.com/egoist/tsup).

## License

MIT
