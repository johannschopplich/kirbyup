# kirbyup

> Take a look into Kirby's [pluginkit](https://github.com/getkirby/pluginkit/tree/4-panel) repository for an example setup.

The fastest and leanest way to bundle your Kirby Panel plugins. No configuration necessary.

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
    "kirbyup": "^0.9.5"
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

## Credits

- [Vite](https://vitejs.dev) by Evan You and all of its contributors.
- [EGOIST](https://github.com/egoist) for his inspirational work on [tsup](https://github.com/egoist/tsup).

## License

MIT
