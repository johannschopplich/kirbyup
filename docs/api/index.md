# CLI API

::: tip

List all commands and options:

```bash
kirbyup --help
```

And for more detailed information about the serve command:

```bash
kirbyup serve --help
```

:::

## `kirbyup <file>`

The `<file>` argument is the entry point of your plugin. kirbyup bundles and minifies it into production-ready `index.js` and `index.css` files in the current directory.

### Options

#### `--out-dir <dir>`

The output directory to save the final Plugin bundle into. Defaults to the current working directory.

#### `--watch [path]`

Enables watch mode. If no path is specified, kirbyup watches the folder of the input file. Repeat `--watch` for multiple paths.

### Examples

**Basic production build:**

```bash
kirbyup src/index.js
```

<<< @/snippets/build.ansi

**Build to a specific directory:**

```bash
kirbyup src/index.js --out-dir ../site/plugins/my-plugin
```

**Watch mode for development (without HMR):**

```bash
kirbyup src/index.js --watch
```

<<< @/snippets/watch.ansi

**Watch specific paths:**

```bash
kirbyup src/index.js --watch "src/**/*.{js,vue,css}" --watch "assets/*"
```

## `kirbyup serve <file>`

Starts a development server with Hot Module Replacement (HMR). This is the recommended way to develop Panel plugins.

### Options

#### `--port <port>`

The port for the development server to run on. Defaults to `5177`.

#### `--out-dir <dir>`

The output directory where the plugin file read by Kirby is saved. Defaults to the project root.

#### `--watch <path>`

Specifies additional files that should be watched for changes, with changes causing the page to reload. Repeat `--watch` for multiple paths.

::: info
By default, kirbyup will watch all PHP files (`./**/*.php`) in the plugin directory and reload the page if it detects changes. Using `--watch` to set your own path overrides this setting, so you need to add the PHP glob explicitly if you want to keep the behavior: `--watch ./my/files/* --watch ./**/*.php`
:::

#### `--no-watch`

Disables the default behavior of watching all PHP files for changes.

### Examples

**Start development server:**

```bash
kirbyup serve src/index.js
```

<<< @/snippets/serve.ansi

**Custom port:**

```bash
kirbyup serve src/index.js --port 3000
```

**Disable PHP file watching:**

```bash
kirbyup serve src/index.js --no-watch
```

**Watch additional file types:**

```bash
kirbyup serve src/index.js --watch "snippets/*.php" --watch "templates/*.php"
```

## Output Files

When you build your plugin, kirbyup generates these files:

| File | Description |
|------|-------------|
| `index.js` | Bundled and minified JavaScript (production) |
| `index.css` | Bundled CSS (if your plugin includes styles) |
| `index.dev.mjs` | Dev server proxy (development only, created by `serve`) |

::: tip
The `index.dev.mjs` file tells Kirby to load assets from the development server instead of the bundled files. It's automatically created when running `kirbyup serve` and should be git-ignored.
:::
