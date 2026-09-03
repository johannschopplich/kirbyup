---
layout: home
titleTemplate: Bundler for Kirby Panel Plugins
hero:
  name: kirbyup
  text: Bundler for Kirby Panel Plugins
  tagline: Zero-config, built-in HMR.
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
    details: Edit a component and the Panel updates in place. No page reload, no rebuild.
    link: /guide/getting-started#development
    linkText: Start the dev server
  - title: Path Aliases
    icon: <span class="i-ri-links-line"></span>
    details: Built-in <code>~/</code> and <code>@/</code> aliases for shorter imports.
    link: /guide/path-aliases
    linkText: Use aliases
  - title: Config File
    icon: <span class="i-ri-file-code-line"></span>
    details: Add Vite plugins and options through <code>kirbyup.config.js</code>.
    link: /guide/config-file
    linkText: Extend Vite
  - title: Environment Variables
    icon: <span class="i-ri-game-line"></span>
    details: Keep debug code in development and drop it from the production bundle.
    link: /guide/environment-variables
    linkText: Use env variables
  - title: Styling
    icon: <span class="i-ri-palette-line"></span>
    details: Sass works out of the box. Add PostCSS with a config file or UnoCSS as a Vite plugin.
    link: /guide/postcss
    linkText: Style your plugin
  - title: kirbyuse
    icon: <span class="i-ri-code-box-line"></span>
    details: Typed <code>window.panel</code>, composables and prop helpers for sections, fields and blocks.
    link: /guide/kirbyuse
    linkText: Meet kirbyuse
---
