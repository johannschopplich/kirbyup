# CLI API

::: tip

List all commands and options:

```bash
kirbyup --help
```

And for more detailed information about the dev command:

```bash
kirbyup dev --help
```

:::

## `kirbyup <file>`

The `<file>` argument is the entry point of your plugin. kirbyup bundles and minifies it into production-ready `index.js` and `index.css` files in the current directory.

### Options

#### `--out-dir <dir>`

The output directory to save the final Plugin bundle into. Defaults to the current working directory.

#### `--watch`

Enables watch mode, rebuilding when the folder of the entry file changes.

#### `--watch-path <paths>`

Watches the given files and folders instead of the folder of the entry file, as a comma-separated list. Implies `--watch`.

::: warning
`--watch-path` takes files and folders here, not glob patterns – folders are watched recursively. The underlying watcher stopped expanding globs in chokidar 4, so a pattern is rejected rather than silently matching nothing.
:::

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
kirbyup src/index.js --watch-path src,assets
```

## `kirbyup dev <file>`

Starts a development server with Hot Module Replacement (HMR). This is the recommended way to develop Panel plugins.

::: info
This command was called `kirbyup serve` before v4. That name still works and does the same thing.
:::

### Options

#### `--port <port>`

The port for the development server to run on. Defaults to `5177`.

#### `--out-dir <dir>`

The output directory where the plugin file read by Kirby is saved. Defaults to the project root.

#### `--watch-path <paths>`

Files, folders and glob patterns that reload the page when they change, as a comma-separated list. Defaults to `./**/*.php`.

::: info
Setting `--watch-path` replaces the default rather than adding to it, so keep the PHP glob if you still want it: `--watch-path "snippets/*.php,./**/*.php"`. Unlike `build`, glob patterns work here – the dev server matches through Vite's own watcher.
:::

#### `--no-watch`

Disables the default behavior of watching all PHP files for changes.

### Examples

**Start development server:**

```bash
kirbyup dev src/index.js
```

<<< @/snippets/dev.ansi

**Custom port:**

```bash
kirbyup dev src/index.js --port 3000
```

**Disable PHP file watching:**

```bash
kirbyup dev src/index.js --no-watch
```

**Watch additional file types:**

```bash
kirbyup dev src/index.js --watch-path "snippets/*.php,templates/*.php"
```

## Output Files

When you build your plugin, kirbyup generates these files:

| File | Description |
|------|-------------|
| `index.js` | Bundled and minified JavaScript (production) |
| `index.css` | Bundled CSS (if your plugin includes styles) |
| `index.dev.js` | Dev server proxy (development only, created by `dev`) |

::: tip
The `index.dev.js` file tells Kirby to load assets from the development server instead of the bundled files. It's automatically created when running `kirbyup dev` and should be git-ignored.
:::
