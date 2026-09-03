# CLI

`kirbyup --help` lists the commands, `kirbyup <command> --help` the options of one command. `--verbose` prints the cause chain and stack trace when a command fails.

## `kirbyup <file>`

Bundles `<file>` and everything it imports into `index.js` and `index.css`, minified. `kirbyup build <file>` is the explicit spelling of the same command.

### Options

#### `-d, --out-dir <dir>`

Directory for the output files. Defaults to the current working directory.

#### `-w, --watch`

Rebuilds when a file in the entry file's folder changes. Watch builds are unminified and written to `index.dev.js`, which is removed when the process exits. The config file is reloaded on change.

#### `--watch-path <paths>`

Comma-separated files and folders to watch instead of the entry file's folder. Implies `--watch`.

Glob patterns are rejected. Folders are watched recursively, so name the folder instead of a pattern.

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
kirbyup src/index.js --watch-path src,assets
```

## `kirbyup dev <file>`

Starts a Vite dev server for `<file>` and writes `index.dev.js`, which tells Kirby to load the plugin from that server. Component edits apply through hot module replacement. The file is removed when the server stops.

### Options

#### `-p, --port <port>`

Port of the dev server. Defaults to `5177`. A `server.port` in the [config file](/api/config#vite) takes precedence.

#### `-d, --out-dir <dir>`

Directory for `index.dev.js`. Defaults to the current working directory.

#### `--watch-path <paths>`

Comma-separated files, folders and glob patterns that reload the page when they change. Defaults to `./**/*.php`.

The value replaces the default. Keep the PHP pattern if you still want it: `--watch-path "snippets/*.php,./**/*.php"`.

#### `--no-watch`

Turns page reloads off. Hot module replacement stays on.

### Examples

```bash
kirbyup dev src/index.js
```

<<< @/snippets/dev.ansi

```bash
kirbyup dev src/index.js --port 3000
```

```bash
kirbyup dev src/index.js --no-watch
```

```bash
kirbyup dev src/index.js --watch-path "snippets/*.php,templates/*.php"
```

## `kirbyup serve <file>`

The name of `dev` before v4. It takes the same options and prints a hint to rename the script.

## Output Files

| File | Written by | Content |
| --- | --- | --- |
| `index.js` | `kirbyup <file>` | Minified plugin bundle |
| `index.css` | `kirbyup <file>` | Styles, if the plugin has any |
| `index.dev.js` | `dev`, `--watch` | Loader for the dev server, or the unminified watch build |

Kirby loads `index.dev.js` when it exists. A production build removes it, `dev` and watch builds remove it on exit. Add it to `.gitignore`.
