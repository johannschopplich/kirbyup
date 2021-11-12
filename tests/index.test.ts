import { resolve } from 'pathe'
import { remove } from 'fs-extra'
import { runCli, cacheDir } from './utils'

beforeAll(async () => {
  await remove(cacheDir)
})

it('handles modules', async () => {
  const { output } = await runCli({
    'src/input.js': `import foo from './foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`
  })

  expect(output).toMatchSnapshot()
})

it('handles css', async () => {
  const { output, getFileContent } = await runCli({
    'src/input.js': `import './input.css'`,
    'src/input.css': `.foo { content: "bar"; }`
  })

  expect(output).toMatchSnapshot()

  const css = await getFileContent('index.css')
  expect(css).toMatchSnapshot()
})

it('supports built-in env variables', async () => {
  const { output } = await runCli({
    'src/input.js': `export const mode = import.meta.env.MODE`
  })

  expect(output).toMatchSnapshot()
})

it('supports resolve aliases', async () => {
  const { output } = await runCli({
    'src/input.js': `import foo from '~/foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`
  })

  expect(output).toMatchSnapshot()
})

it('supports custom env variables', async () => {
  const { output } = await runCli({
    '.env': `KIRBYUP_FOO=bar`,
    'src/input.js': `export const foo = import.meta.env.KIRBYUP_FOO`
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

it('imports components automatically', async () => {
  const { output } = await runCli({
    'src/input.js': `
      import { kirbyup } from '${resolve(
        __dirname,
        '../dist/client/plugin.js'
      )}'

      window.panel.plugin('kirbyup/example', {
        blocks: kirbyup.import('./components/blocks/*.vue')
      })
    `,
    'src/components/blocks/Foo.vue': `<template><k-header>Bar</k-header></template>`
  })

  expect(output).toMatchSnapshot()
})
