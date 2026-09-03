# PostCSS & Sass

Sass works out of the box. PostCSS runs as soon as a config file exists. kirbyup applies no PostCSS plugins of its own, so without a config file the CSS goes through Vite untouched.

## Sass

Use `lang="scss"` or `lang="sass"` in a component. No install, no config:

```vue
<style lang="scss">
$primary: #5d5dff;

.my-section {
  padding: 1rem;

  &__title {
    color: $primary;
    font-weight: bold;
  }
}
</style>
```

Shared files load with `@use`:

```vue
<style lang="scss">
@use './variables' as *;
@use './mixins' as *;

.my-component {
  @include card-shadow;
  color: $text-color;
}
</style>
```

## PostCSS

Create `postcss.config.js` in the project root and list the plugins. They apply to every stylesheet in the bundle:

```js
// postcss.config.js
export default {
  plugins: [],
}
```

Any format [postcss-load-config](https://github.com/postcss/postcss-load-config) understands works, including a `postcss` key in `package.json`. Without `"type": "module"` in `package.json`, name the file `postcss.config.mjs` so Node loads it as ESM without a warning.

## Utility Classes

For utility-first styling, use [UnoCSS](/guide/unocss). It runs as a Vite plugin without PostCSS and prefixes classes per plugin, which matters because Kirby merges every plugin's CSS into one bundle.
