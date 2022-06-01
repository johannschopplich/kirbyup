import { resolve } from 'pathe'
import { remove } from 'fs-extra'
import { runCli, cacheDir } from './utils'
import { expect, it, beforeAll, afterAll } from 'vitest'

beforeAll(async () => {
  await remove(cacheDir)
})

afterAll(async () => {
  await remove(cacheDir)
})

it('builds index.js', async () => {
  const { output } = await runCli({
    'src/input.js': `import foo from './foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`
  })

  expect(output).toMatchSnapshot()
})

it('builds index.css', async () => {
  const { output, getFileContent } = await runCli({
    'src/input.js': `import './input.css'`,
    'src/input.css': `.foo { content: "bar"; }`
  })

  expect(output).toMatchSnapshot()

  const css = await getFileContent('index.css')
  expect(css).toMatchSnapshot()
})

it('supports resolve aliases', async () => {
  const { output } = await runCli({
    'src/input.js': `import foo from '~/foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`
  })

  expect(output).toMatchSnapshot()
})

it('supports built-in env variables', async () => {
  const { output } = await runCli({
    // Skip Vitest transforming `import.meta.env` to `process.env` prior to wrting to file
    'src/input.js': `export const mode = {import.meta}?raw.env.MODE`
  })

  expect(output).toMatchSnapshot()
})

it('supports custom env variables', async () => {
  const { output } = await runCli({
    '.env': `KIRBYUP_FOO=bar`,
    // Skip Vitest transforming `import.meta.env` to `process.env` prior to wrting to file
    'src/input.js': `export const foo = {import.meta}?raw.env.KIRBYUP_FOO`
  })

  expect(output).toMatchSnapshot()
})

it('supports postcss plugins', async () => {
  const { output, getFileContent } = await runCli({
    'src/input.js': `import './input.css'`,
    'src/input.css': `
      .foo { inset: logical 0 5px 10px; }
      .bar:dir(rtl) { margin-right: 10px; }
    `
  })

  expect(output).toMatchSnapshot()

  const css = await getFileContent('index.css')
  expect(css).toMatchSnapshot()
})

it('builds panel plugins', async () => {
  const { output } = await runCli({
    'src/input.js': `
      import Demo from './fields/demo.js'
      window.panel.plugin('kirbyup/test', {
        fields: {
          demo: Demo
        }
      })
    `,
    'src/fields/demo.js': `export default { extends: 'k-info-field' }`
  })

  expect(output).toMatchSnapshot()
})

it('supports auto-importing components', async () => {
  const { output } = await runCli({
    'src/input.js': `
      import { kirbyup } from '${resolve(__dirname, '../dist/plugin.mjs')}'

      window.panel.plugin('kirbyup/example', {
        blocks: kirbyup.import('./components/blocks/*.vue')
      })
    `,
    'src/components/blocks/Foo.vue': `<template><k-header>Bar</k-header></template>`
  })

  expect(output).toMatchSnapshot()
})

it('supports kirbyup.config.js', async () => {
  const { output } = await runCli({
    'src/input.js': `import foo from '__ALIAS__/foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`,
    'kirbyup.config.js': `
      import { resolve } from 'path'
      import { defineConfig } from '${resolve(__dirname, '../dist/index.mjs')}'
      export default defineConfig({
        alias: {
          '__ALIAS__/': resolve(__dirname, 'src') + '/'
        },
        extendViteConfig: {
          build: {
            lib: {
              name: 'test'
            }
          }
        }
      })
    `
  })

  expect(output).toMatchSnapshot()
}, 10000)
