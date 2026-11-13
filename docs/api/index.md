# CLI

`kirbyup --help` lists the commands, `kirbyup <command> --help` the options of one command. `--verbose` adds the stack trace when a command fails.

## `kirbyup <file>`

Bundles `<file>` and everything it imports into `index.js` and `index.css`, minified. `kirbyup build <file>` is the explicit spelling of the same command.

### Options

#### `-d, --out-dir <dir>`

Directory for the output files. Defaults to the current working directory.

#### `-w, --watch`

Rebuilds when a file in the entry file's folder changes. Watch builds are unminified and written to `index.dev.js` and `index.dev.css`, which are removed when the process exits. The config file is reloaded on change.

#### `--watch-path <paths>`

Comma-separated files and folders to watch instead of the entry file's folder. Implies `--watch`.

Glob patterns are rejected. Folders are watched recursively, so name the folder instead of a pattern.

## `kirbyup dev <file>`

Starts a Vite dev server for `<file>` and writes `index.dev.js`, which tells Kirby to load the plugin from that server. Component edits apply through hot module replacement. The file is removed when the server stops. `kirbyup serve`, the v3 name of this command, still runs and prints a hint to rename the script – see [`serve` Is Now `dev`](/guide/migration#serve-is-now-dev).

### Options

#### `-p, --port <port>`

Port of the dev server. Defaults to `5177`. A `server.port` in the [config file](/api/config#vite) takes precedence.

#### `-d, --out-dir <dir>`

Directory for `index.dev.js`. Defaults to the current working directory.

#### `--watch-path <paths>`

Comma-separated files, folders and glob patterns that reload the page when they change. Defaults to `./**/*.php`. Patterns match inside the project root only, files and folders anywhere.

The value replaces the default. Keep the PHP pattern if you still want it: `--watch-path "snippets/*.php,./**/*.php"`.

#### `--no-watch`

Turns page reloads off. Hot module replacement stays on.

## Output Files

| File | Written by | Content |
| --- | --- | --- |
| `index.js` | `kirbyup <file>` | Minified plugin bundle |
| `index.css` | `kirbyup <file>` | Styles, if the plugin has any |
| `index.dev.js` | `dev`, `--watch` | Loader for the dev server, or the unminified watch build |
| `index.dev.css` | `--watch` | Styles of the watch build, if the plugin has any |

Kirby loads `index.dev.js` when it exists and skips `index.css`, taking `index.dev.css` instead if there is one. A production build removes both, plus an `index.css` when the plugin has no styles. A watch build removes both on exit, and `dev` removes `index.dev.js` on exit and a leftover `index.dev.css` on start. Add `index.dev.*` to `.gitignore`.

If the dev server is killed before it can remove `index.dev.js`, the plugin goes missing from the Panel: start `kirbyup dev` again, run a build, or delete the file.
