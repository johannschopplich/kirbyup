# PostCSS

If the project contains a valid PostCSS config (any format supported by [postcss-load-config](https://github.com/postcss/postcss-load-config), e.g. `postcss.config.cjs`), it will be automatically applied to all imported CSS.

If no configuration file is found, kirbyup will apply two PostCSS plugins which the Kirby Panel uses as well to let you embrace the same functionality within your Panel plugins. The following PostCSS transforms are applied by kirbyup:

- [postcss-logical](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-logical) lets you use logical, rather than physical, direction and dimension mappings in CSS, following the [CSS Logical Properties and Values](https://drafts.csswg.org/css-logical/) specification.
- [postcss-dir-pseudo-class](https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-dir-pseudo-class) lets you style by directionality using the `:dir()` pseudo-class in CSS, following the [Selectors](https://www.w3.org/TR/selectors-4/#the-dir-pseudo) specification. It gives you the same syntax Kirby uses for full compatibility with RTL localizations of the Panel.
