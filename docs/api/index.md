# CLI API

::: tip

To conveniently list all available commands and options, run:

```bash
kirbyup --help
```

And for more detailed information about the serve command:

```bash
kirbyup serve --help
```

:::

## `kirbyup <input>`

### `--out-dir <dir>`

The output directory to save the final Plugin bundle into. Defaults to the current working directory.

### `--watch [path]`

Enables watch mode. If no path is specified, kirbyup watches the folder of the input file. Repeat `--watch` for multiple paths.

## `kirbyup serve <input>`

### `--port <port>`

The port for the development server to run on. Defaults to `5177`.

### `--out-dir <dir>`

The output directory where the plugin file read by Kirby is saved. Defaults to the project root.

### `--watch <path>`

Specifies additional files that should be watched for changes, with changes causing the page to reload. Repeat `--watch` for multiple paths.

::: info
By default, kirbyup will watch all PHP files (`./**/*.php`) in the plugin directory and reload the page if it detects changes. Using `--watch` to set your own path overrides this setting, so you need to add the PHP glob explicitly if you want to keep the behavior: `--watch ./my/files/* --watch ./**/*.php`
:::

### `--no-watch`

Disables the default behavior of watching all PHP files for changes.
