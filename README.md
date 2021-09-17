# kirbyup

> Take a lool into the [plainkit](./plainkit) folder for an example setup.

The fastest and leanest way to bundle your Kirby Panel plugins. No configuration necessary.

## Install

Install it locally in your project folder:

```bash
npm i kirbyup --save-dev
```

You can also install it globally but it's not recommended.

## Usage

```json
{
  "scripts": {
    "dev": "kirbyup src/index.js --watch src",
    "build": "kirbyup src/index.js"
  },
  "devDependencies": {
    "kirbyup": "^0.4.0"
  }
}
```

### Development

```bash
kirbyup src/index.js --watch
```

You can also specify the directories to be watched. By default, if no path is specified, it watches the current directory.

```bash
kirbyup src/index.js --watch src
```

You can specify more than a single directory

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
- [EGOIST](https://github.com/egoist) for his work on [tsup](https://github.com/egoist/tsup), on which the CLI was built.

## License

MIT
