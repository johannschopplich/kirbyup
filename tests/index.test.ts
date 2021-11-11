import { resolve } from 'pathe'
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
    "(()=>{var t=function(){\\"use strict\\";var r=\\"bar\\";return r}();})();
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
    "(()=>{(function(){\\"use strict\\";var t=\\"\\"})();})();
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
    "(()=>{var t=function(e){\\"use strict\\";const o=\\"production\\";return e.mode=o,Object.defineProperty(e,\\"__esModule\\",{value:!0}),e[Symbol.toStringTag]=\\"Module\\",e}({});})();
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
    "(()=>{var t=function(){\\"use strict\\";var r=\\"bar\\";return r}();})();
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
    "(()=>{var r=function(o){\\"use strict\\";const e=\\"bar\\";return o.foo=e,Object.defineProperty(o,\\"__esModule\\",{value:!0}),o[Symbol.toStringTag]=\\"Module\\",o}({});})();
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
    "(()=>{(function(){\\"use strict\\";var t=\\"\\"})();})();
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
    "(()=>{(function(){\\"use strict\\";var e={extends:\\"k-info-field\\"};window.panel.plugin(\\"kirbyup/test\\",{fields:{demo:e}})})();})();
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

  expect(output).toMatchInlineSnapshot(`
    "(()=>{(function(){\\"use strict\\";var c=function(){var e=this,o=e.$createElement,i=e._self._c||o;return i(\\"k-header\\",[e._v(\\"Bar\\")])},v=[];function p(e,o,i,_,s,f,l,k){var n=typeof e==\\"function\\"?e.options:e;o&&(n.render=o,n.staticRenderFns=i,n._compiled=!0),_&&(n.functional=!0),f&&(n._scopeId=\\"data-v-\\"+f);var t;if(l?(t=function(r){r=r||this.$vnode&&this.$vnode.ssrContext||this.parent&&this.parent.$vnode&&this.parent.$vnode.ssrContext,!r&&typeof __VUE_SSR_CONTEXT__!=\\"undefined\\"&&(r=__VUE_SSR_CONTEXT__),s&&s.call(this,r),r&&r._registeredComponents&&r._registeredComponents.add(l)},n._ssrRegister=t):s&&(t=k?function(){s.call(this,(n.functional?this.parent:this).$root.$options.shadowRoot)}:s),t)if(n.functional){n._injectStyles=t;var R=n.render;n.render=function(S,d){return t.call(d),R(S,d)}}else{var u=n.beforeCreate;n.beforeCreate=u?[].concat(u,t):[t]}return{exports:e,options:n}}const h={},a={};var m=p(h,c,v,!1,b,null,null,null);function b(e){for(let o in a)this[o]=a[o]}var C=function(){return m.exports}(),g=Object.freeze({__proto__:null,[Symbol.toStringTag]:\\"Module\\",default:C});const O=e=>e.substring(e.lastIndexOf(\\"/\\")+1,e.lastIndexOf(\\".\\")).toLowerCase(),$=Object.freeze({import(e){return Object.entries(e).reduce((o,[i,_])=>(o[O(i)]=_.default,o),{})}});window.panel.plugin(\\"kirbyup/example\\",{blocks:$.import({\\"./components/blocks/Foo.vue\\":g})})})();})();
    "
  `)

  expect(outFiles).toMatchInlineSnapshot(`
    Array [
      "index.js",
    ]
  `)
})
