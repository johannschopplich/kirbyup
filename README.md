# kirbyup

> Take a lool into the [pluginkit](./pluginkit) folder for an example setup.

The fastest and leanest way to bundle your Kirby Panel plugins. No configuration necessary.

## Install

Install it locally in your project folder:

```bash
npm i kirbyup --save-dev
```

You can also install it globally.

## Usage

```json
{
  "scripts": {
    "dev": "npx -y kirbyup src/index.js --watch",
    "build": "npx -y kirbyup src/index.js"
  }
}
```

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

## TODO

- [ ] HMR with Vite in lib mode

## Credits

- [Vite](https://vitejs.dev) by Evan You and all of its contributors.
- [EGOIST](https://github.com/egoist) for his inspirational work on [tsup](https://github.com/egoist/tsup).

## License

MIT
