# PostCSS

Add PostCSS transformations by creating a config file and installing your plugins.

If the project contains a valid PostCSS config (any format supported by [postcss-load-config](https://github.com/postcss/postcss-load-config), e.g. `postcss.config.cjs`), it will be automatically applied to all imported CSS.

::: info
As of v3.3, kirbyup no longer applies any default PostCSS plugins. This aligns with Kirby 4 and newer, which uses plain Vite without additional PostCSS configurations.

Without a custom configuration, no PostCSS transformations will be applied beyond what Vite provides by default.
:::

## Example: Autoprefixer

Install autoprefixer:

::: code-group
```bash [pnpm]
pnpm add -D autoprefixer
```
```bash [npm]
npm i -D autoprefixer
```
:::

Create `postcss.config.cjs`:

```js
module.exports = {
  plugins: {
    autoprefixer: {},
  },
}
```

## Example: Tailwind CSS

Install Tailwind CSS and its dependencies:

::: code-group
```bash [pnpm]
pnpm add -D tailwindcss autoprefixer
```
```bash [npm]
npm i -D tailwindcss autoprefixer
```
:::

Create `postcss.config.cjs`:

```js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

Create `tailwind.config.cjs`:

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{vue,js}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

::: tip
Check out the [Tailwind CSS starter](https://github.com/johannschopplich/kirbyup/tree/main/examples/tailwindcss) for a complete example.
:::

## Sass/SCSS Support

kirbyup includes built-in Sass support. No additional configuration is required – simply use `.scss` or `.sass` files in your Vue components:

```vue
<style lang="scss">
$primary: #5d5dff;

.my-section {
  padding: 1rem;

  &__title {
    color: $primary;
    font-weight: bold;
  }

  &:hover {
    background: lighten($primary, 40%);
  }
}
</style>
```

You can also import external Sass files:

```vue
<style lang="scss">
@import './variables.scss';
@import './mixins.scss';

.my-component {
  @include card-shadow;
  color: $text-color;
}
</style>
```
