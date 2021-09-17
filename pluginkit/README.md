# Kirbyup Pluginkit: Example plugin for Kirby

## How to use the Pluginkit

1. Change the plugin name and description in the `composer.json`
1. Change the plugin name in the `index.php` and `src/index.js`
1. Change the license if you don't want to publish under MIT
1. Add your plugin code to the `index.php` and `src/index.js`
1. Update this `README` with instructions for your plugin

### Installation

We use [kirbyupi](https://github.com/johannschopplich/kirbyup) for the development and build setup.

```bash
npm install
```

### Development

You can start the dev process with:

```bash
npm run dev
```

This will automatically update the `index.js` and `index.css` of your plugin as soon as you make changes. Reload the panel once and afterwards you should see changes immediately without further reloading.

### Production

As soon as you are happy with your plugin, you should build the final version with

```bash
npm run build
```

This will automatically create a minified and optimized version of your `index.js` and `index.css`
which you can ship with your plugin.

We have a tutorial on how to build your own plugin based on the Pluginkit [in the Kirby documentation](https://getkirby.com/docs/guide/plugins/plugin-setup-basic).

What follows is an example README for your plugin.

****

## Installation

### Download

Download and copy this repository to `/site/plugins/{{ plugin-name }}`.

### Git submodule

```
git submodule add https://github.com/{{ your-name }}/{{ plugin-name }}.git site/plugins/{{ plugin-name }}
```

### Composer

```
composer require {{ your-name }}/{{ plugin-name }}
```

## Setup

*Additional instructions on how to configure the plugin (e.g. blueprint setup, config options, etc.)*

## Options

*Document the options and APIs that this plugin offers*

## Development

*Add instructions on how to help working on the plugin (e.g. npm setup, Composer dev dependencies, etc.)*

## License

MIT

## Credits

- [Your Name](https://github.com/ghost)
