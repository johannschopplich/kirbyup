# PostCSS

To use PostCSS transformations in your project, you will need to create your own PostCSS configuration file and install the necessary plugins.

If the project contains a valid PostCSS config (any format supported by [postcss-load-config](https://github.com/postcss/postcss-load-config), e.g. `postcss.config.cjs`), it will be automatically applied to all imported CSS.

::: info
As of v3.3, kirbyup it no longer applies any default PostCSS plugins. This aligns with Kirby 4 and newer, which uses plain Vite without additional PostCSS configurations.

Without a custom configuration, no PostCSS transformations will be applied beyond what Vite provides by default.
:::
