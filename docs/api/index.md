# CLI

`kirbyup --help` lists the commands, `kirbyup serve --help` the options of the dev server.

## `kirbyup <file>`

Bundles `<file>` and everything it imports into `index.js` and `index.css`, minified.

### Options

#### `-d, --out-dir <dir>`

Directory for the output files. Defaults to the current working directory.

#### `-w, --watch [path]`

Rebuilds when a file changes. Without a path, the entry file's folder is watched. Pass a path or glob pattern to watch something else, and repeat the flag for several. Watch builds are unminified and written to `index.js`. The config file is reloaded on change.

### Examples

```bash
kirbyup src/index.js
```

<<< @/snippets/build.ansi

```bash
kirbyup src/index.js --out-dir ../site/plugins/my-plugin
```

```bash
kirbyup src/index.js --watch
```

<<< @/snippets/watch.ansi

```bash
kirbyup src/index.js --watch "src/**/*.{js,vue,css}" --watch "assets/*"
```

## `kirbyup serve <file>`

Starts a Vite dev server for `<file>` and writes `index.dev.mjs`, which tells Kirby to load the plugin from that server. Component edits apply through hot module replacement. The file is removed when the server stops.

### Options

#### `-p, --port <port>`

Port of the dev server. Defaults to `5177`. A `server.port` in the [config file](/api/config#vite) takes precedence.

#### `-d, --out-dir <dir>`

Directory for `index.dev.mjs`. Defaults to the current working directory.

#### `-w, --watch <path>`

File, folder or glob pattern that reloads the page on change. Repeat the flag for several. Defaults to `./**/*.php`.

The value replaces the default. Keep the PHP pattern if you still want it: `--watch "snippets/*.php" --watch "./**/*.php"`.

#### `--no-watch`

Turns page reloads off. Hot module replacement stays on.

### Examples

```bash
kirbyup serve src/index.js
```

<<< @/snippets/serve.ansi

```bash
kirbyup serve src/index.js --port 3000
```

```bash
kirbyup serve src/index.js --no-watch
```

```bash
kirbyup serve src/index.js --watch "snippets/*.php" --watch "templates/*.php"
```

## Output Files

| File | Written by | Content |
| --- | --- | --- |
| `index.js` | `kirbyup <file>` | Minified plugin bundle |
| `index.css` | `kirbyup <file>` | Styles, if the plugin has any |
| `index.dev.mjs` | `serve` | Loader for the dev server |

Kirby loads `index.dev.mjs` when it exists. A production build removes it, `serve` removes it on exit. Add it to `.gitignore`.
