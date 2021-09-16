# kirbyup

The fastest and leanest way to bundle your Kirby Panel plugins. No configuration necessary.

## Install

Install it locally in your project folder:

```bash
npm i kirbyup --save-dev
```

You can also install it globally but it's not recommended.

## Usage

### Bundle files

```bash
kirbyup src/index.js
```

The final panel plugin will be written into the current directory as `./index.js`.

## Credits

- [EGOIST](https://github.com/egoist) for his work on [tsup](https://github.com/egoist/tsup), on which the CLI was built.
- [Vite](https://vitejs.dev) by Evan You and all of its contributors.

## License

MIT
