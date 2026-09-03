import type { DefaultTheme } from 'vitepress'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vitepress'
import { description, name, version } from '../../package.json'
import {
  github,
  ogImage,
  ogUrl,
  releases,
  twitterImage,
} from './meta'

export default defineConfig({
  lang: 'en-US',
  title: name,
  description: 'Official Bundler for Kirby Panel Plugins',
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Johann Schopplich' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:title', content: name }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: name }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: twitterImage }],
    ['meta', { name: 'twitter:site', content: '@jschopplich' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
  ],

  vite: {
    plugins: [
      UnoCSS(),
    ],
  },

  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },

    editLink: {
      pattern: 'https://github.com/johannschopplich/kirbyup/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    nav: nav(),

    sidebar: {
      '/guide/': sidebarGuide(),
      '/cookbook/': sidebarGuide(),
      '/api/': sidebarApi(),
    },

    socialLinks: [
      { icon: 'github', link: github },
    ],

    footer: {
      message: 'Released under the <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a>.',
      copyright: [
        'Copyright © 2021-PRESENT <a href="https://github.com/johannschopplich" target="_blank">Johann Schopplich</a>.',
        'Copyright © 2022-PRESENT <a href="https://github.com/jonaskuske" target="_blank">Jonas Kuske</a>.',
      ].join('<br>'),
    },

    search: {
      provider: 'local',
    },
  },
})

function nav(): DefaultTheme.NavItem[] {
  return [
    {
      text: 'Guide',
      activeMatch: '^/(guide|cookbook)/',
      items: [
        { text: 'Getting Started', link: '/guide/getting-started' },
        { text: 'Config File', link: '/guide/config-file' },
        { text: 'kirbyuse', link: '/guide/kirbyuse' },
      ],
    },
    {
      text: 'API',
      link: '/api/',
      activeMatch: '^/api/',
    },
    {
      text: `v${version}`,
      items: [
        { text: 'Release Notes', link: releases },
      ],
    },
  ]
}

function sidebarGuide(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'Guide',
      items: [
        { text: 'Getting Started', link: '/guide/getting-started' },
      ],
    },
    {
      text: 'Features',
      items: [
        { text: 'Config File', link: '/guide/config-file' },
        { text: 'Env Variables', link: '/guide/environment-variables' },
        { text: 'Path Aliases', link: '/guide/path-aliases' },
        { text: 'Auto-Imports', link: '/guide/glob-imports' },
      ],
    },
    {
      text: 'Styling',
      items: [
        { text: 'PostCSS & Sass', link: '/guide/postcss' },
        { text: 'UnoCSS', link: '/guide/unocss' },
      ],
    },
    {
      text: 'Ecosystem',
      items: [
        { text: 'kirbyuse', link: '/guide/kirbyuse' },
      ],
    },
    {
      text: 'Cookbook',
      items: [
        { text: 'Import From Panel', link: '/cookbook/import-from-panel' },
      ],
    },
    { text: 'API', link: '/api/' },
    { text: 'Starters', link: `${github}/tree/main/examples` },
  ]
}

function sidebarApi(): DefaultTheme.SidebarItem[] {
  return [
    {
      text: 'API',
      items: [
        { text: 'CLI', link: '/api/' },
        { text: 'Config', link: '/api/config' },
        { text: 'Plugin Helpers', link: '/api/plugin' },
      ],
    },
    { text: 'Guide', link: '/guide/getting-started' },
  ]
}
