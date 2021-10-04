import { remove } from 'fs-extra'
import { run, cacheDir } from './utils'

beforeAll(async () => {
  await remove(cacheDir)
})

it('handles modules', async () => {
  const { output, outFiles } = await run({
    'src/input.js': `import foo from './foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`
  })

  expect(output).toMatchInlineSnapshot(`
    "var kirbyupExport=function(){\\"use strict\\";return\\"bar\\"}();
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})

it('handles css', async () => {
  const { output, outFiles, getFileContent } = await run({
    'src/input.js': `import './input.css'`,
    'src/input.css': `.foo { content: "bar"; }`
  })

  expect(output).toMatchInlineSnapshot(`
    "!function(){\\"use strict\\"}();
    "
  `)

  const css = await getFileContent('index.css')
  expect(css).toMatchInlineSnapshot(`
    ".foo{content:\\"bar\\"}
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.css",
      "index.js",
    ]
  `)
})

it('supports built-in env variables', async () => {
  const { output, outFiles } = await run({
    'src/input.js': `export const mode = import.meta.env.MODE`
  })

  expect(output).toMatchInlineSnapshot(`
    "var kirbyupExport=function(e){\\"use strict\\";return e.mode=\\"production\\",Object.defineProperty(e,\\"__esModule\\",{value:!0}),e[Symbol.toStringTag]=\\"Module\\",e}({});
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})

it('supports resolve aliases', async () => {
  const { output, outFiles } = await run({
    'src/input.js': `import foo from '~/foo'\nexport default foo`,
    'src/foo.js': `export default 'bar'`
  })

  expect(output).toMatchInlineSnapshot(`
    "var kirbyupExport=function(){\\"use strict\\";return\\"bar\\"}();
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})

it('supports custom env variables', async () => {
  const { output, outFiles } = await run({
    '.env': `KIRBYUP_FOO=bar`,
    'src/input.js': `export const foo = import.meta.env.KIRBYUP_FOO`
  })

  expect(output).toMatchInlineSnapshot(`
    "var kirbyupExport=function(e){\\"use strict\\";return e.foo=\\"bar\\",Object.defineProperty(e,\\"__esModule\\",{value:!0}),e[Symbol.toStringTag]=\\"Module\\",e}({});
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})

it('supports postcss plugins', async () => {
  const { output, outFiles, getFileContent } = await run({
    'src/input.js': `import './input.css'`,
    'src/input.css': `
      .foo { inset: logical 0 5px 10px; }
      .bar:dir(rtl) { margin-right: 10px; }
    `
  })

  expect(output).toMatchInlineSnapshot(`
    "!function(){\\"use strict\\"}();
    "
  `)

  const css = await getFileContent('index.css')
  expect(css).toMatchInlineSnapshot(`
    ".foo{top:0;left:5px;bottom:10px;right:5px}[dir=rtl] .bar{margin-right:10px}
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.css",
      "index.js",
    ]
  `)
})

it('builds panel plugins', async () => {
  const { output, outFiles } = await run({
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

  expect(output).toMatchInlineSnapshot(`
    "!function(){\\"use strict\\";window.panel.plugin(\\"kirbyup/test\\",{fields:{demo:{extends:\\"k-info-field\\"}}})}();
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})
