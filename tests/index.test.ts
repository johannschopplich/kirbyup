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

it('imports components automatically', async () => {
  const { output, outFiles } = await run({
    'src/input.js': `
      import { kirbyup } from '${process.cwd()}/dist/client/plugin.js'

      window.panel.plugin('kirbyup/example', {
        blocks: kirbyup.import('./components/blocks/*.vue')
      })
    `,
    'src/components/blocks/Foo.vue': `<template><k-header>Bar</k-header></template>`
  })

  expect(output).toMatchInlineSnapshot(`
    "!function(){\\"use strict\\";function e(e,t,n,o,r,s,i,a){var l,c=\\"function\\"==typeof e?e.options:e;if(t&&(c.render=t,c.staticRenderFns=n,c._compiled=!0),o&&(c.functional=!0),s&&(c._scopeId=\\"data-v-\\"+s),i?(l=function(e){(e=e||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext)||\\"undefined\\"==typeof __VUE_SSR_CONTEXT__||(e=__VUE_SSR_CONTEXT__),r&&r.call(this,e),e&&e._registeredComponents&&e._registeredComponents.add(i)},c._ssrRegister=l):r&&(l=a?function(){r.call(this,(c.functional?this.parent:this).$root.$options.shadowRoot)}:r),l)if(c.functional){c._injectStyles=l;var u=c.render;c.render=function(e,t){return l.call(t),u(e,t)}}else{var f=c.beforeCreate;c.beforeCreate=f?[].concat(f,l):[l]}return{exports:e,options:c}}const t={};var n=e({},(function(){var e=this,t=e.$createElement;return(e._self._c||t)(\\"k-header\\",[e._v(\\"Bar\\")])}),[],!1,o,null,null,null);function o(e){for(let n in t)this[n]=t[n]}var r=function(){return n.exports}(),s=Object.freeze({__proto__:null,[Symbol.toStringTag]:\\"Module\\",default:r});const i=Object.freeze({import:e=>Object.entries(e).reduce(((e,[t,n])=>(e[(e=>e.substring(e.lastIndexOf(\\"/\\")+1,e.lastIndexOf(\\".\\")).toLowerCase())(t)]=n.default,e)),{})});window.panel.plugin(\\"kirbyup/example\\",{blocks:i.import({\\"./components/blocks/Foo.vue\\":s})})}();
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})
