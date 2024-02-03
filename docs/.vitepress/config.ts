import { defineConfig } from 'vitepress'
import type { DefaultTheme } from 'vitepress'
import { description, name, version } from '../../package.json'
import {
  github,
  ogImage,
  ogUrl,
  releases,
} from './meta'

const url = new URL(ogUrl)

export default defineConfig({
  lang: 'en-US',
  title: name,
  description: 'Official Bundler for Kirby Panel Plugins',
  head: [
    ['link', { rel: 'icon', href: '/logo.svg', type: 'image/svg+xml' }],
    ['meta', { name: 'author', content: 'Johann Schopplich' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:url', content: ogUrl }],
    ['meta', { property: 'og:title', content: name }],
    ['meta', { property: 'og:description', content: description }],
    ['meta', { property: 'og:image', content: ogImage }],
    ['meta', { name: 'twitter:title', content: name }],
    ['meta', { name: 'twitter:description', content: description }],
    ['meta', { name: 'twitter:image', content: ogImage }],
    ['meta', { name: 'twitter:site', content: '@jschopplich' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    // Plausible analytics
    ['script', { 'src': 'https://plausible.io/js/script.js', 'defer': '', 'data-domain': url.hostname }],
  ],

  appearance: 'dark',

  themeConfig: {
    logo: '/logo.svg',

    editLink: {
      pattern: 'https://github.com/johannschopplich/kirbyup/edit/main/docs/:path',
      text: 'Suggest changes to this page',
    },

    nav: nav(),

    sidebar: {
      '/guide/': sidebarGuide(),
      '/api/': sidebarGuide(),
    },

    socialLinks: [
      { icon: 'github', link: github },
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2021-PRESENT Johann Schopplich & Jonas Kuske.',
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
      activeMatch: '^/guide/',
      items: [
        {
          text: 'Guide',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Config File', link: '/guide/config-file' },
          ],
        },
        {
          text: 'Usage',
          items: [
            { text: 'Env Variables', link: '/guide/environment-variables' },
            { text: 'Path Aliases', link: '/guide/path-aliases' },
            { text: 'PostCSS', link: '/guide/postcss' },
            { text: 'Glob Imports', link: '/guide/glob-imports' },
          ],
        },
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
        {
          text: 'Release Notes ',
          link: releases,
        },
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
        { text: 'Config File', link: '/guide/config-file' },
      ],
    },
    {
      text: 'Usage',
      items: [
        { text: 'Env Variables', link: '/guide/environment-variables' },
        { text: 'Path Aliases', link: '/guide/path-aliases' },
        { text: 'PostCSS', link: '/guide/postcss' },
        { text: 'Glob Imports', link: '/guide/glob-imports' },
      ],
    },
    { text: 'API', link: '/api/' },
    { text: 'Starters', link: 'https://github.com/johannschopplich/kirbyup/tree/main/examples' },
  ]
}
