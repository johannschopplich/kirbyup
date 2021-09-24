import { remove } from 'fs-extra'
import { run, cacheDir } from './utils'

beforeAll(async () => {
  await remove(cacheDir)
})

it('handles modules', async () => {
  const { output, outFiles } = await run({
    'src/input.js': `import foo from './foo'\nexport default foo`,
    'src/foo.js': `export default 'foo'`
  })

  expect(output).toMatchInlineSnapshot(`
"var kirbyupExport=function(){\\"use strict\\";return\\"foo\\"}();
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
    'src/input.css': `body { margin: 0; }`
  })

  expect(output).toMatchInlineSnapshot(`
"!function(){\\"use strict\\"}();
"
`)

  const css = await getFileContent('index.css')
  expect(css).toMatchInlineSnapshot(`
"body{margin:0}
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
