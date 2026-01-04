---
layout: home
titleTemplate: Bundler for Kirby Panel Plugins
hero:
  name: kirbyup
  text: Bundler for Kirby Panel Plugins
  tagline: Zero-config usage, built-in HMR.
  image:
    light:
      src: /logo-shadow-light.svg
    dark:
      src: /logo-shadow-dark.svg
    alt: kirbyup
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: API
      link: /api/
    - theme: alt
      text: View on GitHub
      link: https://github.com/johannschopplich/kirbyup

features:
  - title: Hot Module Replacement
    icon: <span class="i-ri-speed-up-line"></span>
    details: Instantly see changes in the Panel without a page reload.
    link: /guide/getting-started.html#development
    linkText: Development Usage
  - title: PostCSS & Sass
    icon: <span class="i-ri-layout-masonry-line"></span>
    details: Built-in Sass support and PostCSS plugin integration.
    link: /guide/postcss
    linkText: Use PostCSS
  - title: kirbyuse Integration
    icon: <span class="i-ri-code-box-line"></span>
    details: Vue Composition utilities and TypeScript support for Panel plugins.
    link: /guide/kirbyuse
    linkText: Learn More
  - title: Environment Variables
    icon: <span class="i-ri-game-line"></span>
    details: Run actions based on environment variables.
    link: /guide/environment-variables
    linkText: Conditional Builds
  - title: Configuration File
    icon: <span class="i-ri-file-code-line"></span>
    details: Extend Vite with a <code>kirbyup.config.js</code> configuration file.
    link: /guide/config-file
    linkText: Create a Config File
  - title: Path Aliases
    icon: <span class="i-ri-links-line"></span>
    details: Built-in <code>~/</code> and <code>@/</code> aliases for cleaner imports.
    link: /guide/path-aliases
    linkText: Use Aliases
---
