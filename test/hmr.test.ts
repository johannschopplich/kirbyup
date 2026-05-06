import type { Plugin } from 'vite'
import { describe, expect, it, vi } from 'vitest'
import { kirbyupHmrPlugin } from '../src/node/plugins/hmr'
import { __HMR_SHIM_CODE__, extractEsmNamedExports } from '../src/node/plugins/utils'

const SHIM_ID = '\0kirbyup:hmr-shim'
const VUE_STUB_ID = '\0kirbyup:vue-stub'

function createPlugin(): Plugin {
  const plugin = kirbyupHmrPlugin({
    cwd: process.cwd(),
    entry: 'src/index.ts',
    watch: false,
    port: 3000,
  })

  ;(plugin.configResolved as (config: any) => void).call(
    plugin,
    { root: process.cwd() },
  )

  return plugin
}

function callHook<R>(
  plugin: Plugin,
  name: 'transform' | 'load' | 'resolveId',
  ...args: any[]
): R {
  const hook = plugin[name] as any
  const handler = typeof hook === 'function' ? hook : hook.handler
  return handler.call(plugin, ...args)
}

describe('kirbyupHmrPlugin', () => {
  describe('resolveId', () => {
    it('claims the shim id in both internal and public forms', () => {
      const plugin = createPlugin()
      expect(callHook(plugin, 'resolveId', SHIM_ID)).toBe(SHIM_ID)
      expect(callHook(plugin, 'resolveId', SHIM_ID.slice(1))).toBe(SHIM_ID)
    })

    it('claims the vue stub id in both internal and public forms', () => {
      const plugin = createPlugin()
      expect(callHook(plugin, 'resolveId', VUE_STUB_ID)).toBe(VUE_STUB_ID)
      expect(callHook(plugin, 'resolveId', VUE_STUB_ID.slice(1))).toBe(VUE_STUB_ID)
    })

    it('passes through unrelated ids', () => {
      const plugin = createPlugin()
      expect(callHook(plugin, 'resolveId', 'vue')).toBeUndefined()
      expect(callHook(plugin, 'resolveId', '/path/to/Component.vue')).toBeUndefined()
    })
  })

  describe('load', () => {
    it('returns shim source for the shim id', () => {
      const plugin = createPlugin()
      const result = callHook<{ code: string, map: null }>(plugin, 'load', SHIM_ID)
      expect(result).toBeDefined()
      expect(typeof result.code).toBe('string')
      expect(result.code.length).toBeGreaterThan(0)
    })

    it('returns vue stub source for the vue stub id', () => {
      const plugin = createPlugin()
      const result = callHook<{ code: string, map: null }>(plugin, 'load', VUE_STUB_ID)
      expect(result).toBeDefined()
      expect(typeof result.code).toBe('string')
      expect(result.code.length).toBeGreaterThan(0)
    })

    it('passes through unrelated ids', () => {
      const plugin = createPlugin()
      expect(callHook(plugin, 'load', '/path/to/Component.vue')).toBeUndefined()
      expect(callHook(plugin, 'load', '\0other:virtual')).toBeUndefined()
    })
  })

  describe('transform', () => {
    it('injects the shim import at the top of the entry', () => {
      const plugin = createPlugin()
      const entryId = `${process.cwd()}/src/index.ts`
      const code = `console.log('entry')`
      const result = callHook<{ code: string, map: null }>(plugin, 'transform', code, entryId)

      expect(result).toBeDefined()
      expect(result.code.startsWith(`import ${JSON.stringify(SHIM_ID)}`)).toBe(true)
      expect(result.code).toContain(code)
    })

    it('matches the entry id when it carries a query suffix', () => {
      const plugin = createPlugin()
      const entryId = `${process.cwd()}/src/index.ts?t=12345`
      const result = callHook<{ code: string, map: null }>(plugin, 'transform', `x`, entryId)

      expect(result).toBeDefined()
      expect(result.code.startsWith(`import ${JSON.stringify(SHIM_ID)}`)).toBe(true)
    })

    it('passes through non-entry files', () => {
      const plugin = createPlugin()
      expect(callHook(plugin, 'transform', `x`, '/some/other/file.ts')).toBeUndefined()
      expect(callHook(plugin, 'transform', `x`, '/path/to/Component.vue')).toBeUndefined()
    })

    it('skips entries that already import the shim', () => {
      const plugin = createPlugin()
      const entryId = `${process.cwd()}/src/index.ts`
      const code = `import ${JSON.stringify(SHIM_ID)}\nconsole.log('entry')`
      expect(callHook(plugin, 'transform', code, entryId)).toBeUndefined()
    })
  })
})

interface ShimWindow {
  panel?: {
    app?: any
    plugins?: {
      components?: Record<string, any>
      resolveComponentExtension?: (...args: any[]) => any
      resolveComponentRender?: (...args: any[]) => any
      resolveComponentMixins?: (...args: any[]) => any
    }
  }
}

interface ShimRuntime {
  reload: (id: string, newComp: any) => any
}

interface ShimGlobals {
  window: ShimWindow
  __VUE_HMR_RUNTIME__: ShimRuntime | undefined
  console: { warn: (...args: any[]) => void }
}

function evalShim(globals: ShimGlobals): void {
  // Strip the `import 'vue'` so the body is legal inside `new Function`
  const body = __HMR_SHIM_CODE__.replace(/import\s+['"]vue['"];?\s*/, '')
  // eslint-disable-next-line no-new-func
  new Function('window', '__VUE_HMR_RUNTIME__', 'console', body)(
    globals.window,
    globals.__VUE_HMR_RUNTIME__,
    globals.console,
  )
}

describe('__HMR_SHIM_CODE__', () => {
  it('replaces __VUE_HMR_RUNTIME__.reload with a wrapper', () => {
    const originalReload = vi.fn()
    const runtime: ShimRuntime = { reload: originalReload }
    evalShim({
      window: { panel: { app: {}, plugins: { components: {} } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    expect(runtime.reload).not.toBe(originalReload)
  })

  it('runs Kirby helpers in extension → render → mixins order on __hmrId match, then delegates to the original reload', () => {
    const calls: string[] = []
    const sfc = { __hmrId: 'abc' }
    const helpers = {
      resolveComponentExtension: vi.fn(() => { calls.push('ext') }),
      resolveComponentRender: vi.fn(() => { calls.push('render') }),
      resolveComponentMixins: vi.fn(() => { calls.push('mix') }),
    }
    const originalReload = vi.fn()
    const runtime: ShimRuntime = { reload: originalReload }
    evalShim({
      window: { panel: { app: {}, plugins: { ...helpers, components: { foo: sfc } } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('abc', sfc)
    expect(calls).toEqual(['ext', 'render', 'mix'])
    expect(originalReload).toHaveBeenCalledWith('abc', sfc)
  })

  it('passes the panel app, matching name, and newComp to resolveComponentExtension', () => {
    const helpers = {
      resolveComponentExtension: vi.fn(),
      resolveComponentRender: vi.fn(),
      resolveComponentMixins: vi.fn(),
    }
    const app = { id: 'panel-app' }
    const newComp = { __hmrId: 'abc' }
    const runtime: ShimRuntime = { reload: vi.fn() }
    evalShim({
      window: { panel: { app, plugins: { ...helpers, components: { 'k-foo': { __hmrId: 'abc' } } } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('abc', newComp)
    expect(helpers.resolveComponentExtension).toHaveBeenCalledWith(app, 'k-foo', newComp)
    expect(helpers.resolveComponentRender).toHaveBeenCalledWith(newComp)
    expect(helpers.resolveComponentMixins).toHaveBeenCalledWith(newComp)
  })

  it('matches by __file when __hmrId differs', () => {
    const helpers = {
      resolveComponentExtension: vi.fn(),
      resolveComponentRender: vi.fn(),
      resolveComponentMixins: vi.fn(),
    }
    const stale = { __hmrId: 'old-hash', __file: '/src/MyComp.vue' }
    const fresh = { __hmrId: 'new-hash', __file: '/src/MyComp.vue' }
    const runtime: ShimRuntime = { reload: vi.fn() }
    evalShim({
      window: { panel: { app: {}, plugins: { ...helpers, components: { foo: stale } } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('new-hash', fresh)
    expect(helpers.resolveComponentExtension).toHaveBeenCalledWith({}, 'foo', fresh)
  })

  it('skips helpers but still delegates to original reload when no plugin component matches', () => {
    const originalReload = vi.fn()
    const helpers = {
      resolveComponentExtension: vi.fn(),
      resolveComponentRender: vi.fn(),
      resolveComponentMixins: vi.fn(),
    }
    const runtime: ShimRuntime = { reload: originalReload }
    evalShim({
      window: { panel: { app: {}, plugins: { ...helpers, components: { foo: { __hmrId: 'unrelated', __file: '/foo.vue' } } } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    const newComp = { __hmrId: 'xyz', __file: '/xyz.vue' }
    runtime.reload('xyz', newComp)
    expect(helpers.resolveComponentExtension).not.toHaveBeenCalled()
    expect(helpers.resolveComponentRender).not.toHaveBeenCalled()
    expect(helpers.resolveComponentMixins).not.toHaveBeenCalled()
    expect(originalReload).toHaveBeenCalledWith('xyz', newComp)
  })

  it('skips helpers when a Kirby helper is missing', () => {
    const originalReload = vi.fn()
    const resolveComponentRender = vi.fn()
    const resolveComponentMixins = vi.fn()
    const runtime: ShimRuntime = { reload: originalReload }
    evalShim({
      window: { panel: { app: {}, plugins: {
        // resolveComponentExtension intentionally missing
        resolveComponentRender,
        resolveComponentMixins,
        components: { foo: { __hmrId: 'abc' } },
      } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('abc', { __hmrId: 'abc' })
    expect(resolveComponentRender).not.toHaveBeenCalled()
    expect(resolveComponentMixins).not.toHaveBeenCalled()
    expect(originalReload).toHaveBeenCalled()
  })

  it('stops walking after the first matching component', () => {
    const ext = vi.fn()
    const sharedSfc = { __hmrId: 'abc' }
    const runtime: ShimRuntime = { reload: vi.fn() }
    evalShim({
      window: { panel: { app: {}, plugins: {
        resolveComponentExtension: ext,
        resolveComponentRender: vi.fn(),
        resolveComponentMixins: vi.fn(),
        // Same SFC registered under two names – iteration is insertion-ordered.
        components: { first: sharedSfc, second: sharedSfc },
      } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('abc', { __hmrId: 'abc' })
    expect(ext).toHaveBeenCalledTimes(1)
    expect(ext.mock.calls[0]![1]).toBe('first')
  })

  it('logs a warning when __VUE_HMR_RUNTIME__ is undefined', () => {
    const warn = vi.fn()
    evalShim({
      window: {},
      __VUE_HMR_RUNTIME__: undefined,
      console: { warn },
    })

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0]![0])).toMatch(/Vue HMR runtime not detected/)
  })
})

describe('extractEsmNamedExports', () => {
  it('reads names from a single trailing export block', () => {
    const source = `const ref = ...\nconst computed = ...\nexport { ref, computed }`
    expect(extractEsmNamedExports(source)).toEqual(['ref', 'computed'])
  })

  it('resolves `as` aliases to their public names', () => {
    const source = `export { compileToFunction as compile, createBaseVNode as createElementVNode, ref }`
    expect(extractEsmNamedExports(source)).toEqual(['compile', 'createElementVNode', 'ref'])
  })

  it('considers only the last export block when multiple are present', () => {
    const source = `export { internal }\n// later\nexport { ref, reactive }`
    expect(extractEsmNamedExports(source)).toEqual(['ref', 'reactive'])
  })

  it('returns an empty array when no export block is found', () => {
    expect(extractEsmNamedExports('const x = 1')).toEqual([])
    expect(extractEsmNamedExports('')).toEqual([])
  })

  it('finds Vue 3 exports inside the installed vue.esm-browser.js', async () => {
    const fs = await import('node:fs/promises')
    const { resolve } = await import('pathe')
    const path = resolve(process.cwd(), 'node_modules/vue/dist/vue.esm-browser.js')
    const source = await fs.readFile(path, 'utf8')
    const names = extractEsmNamedExports(source)

    // Spot-check a handful of well-known Vue 3 names
    for (const expected of ['defineComponent', 'ref', 'reactive', 'computed', 'h', 'createApp', 'Fragment', 'Teleport']) {
      expect(names).toContain(expected)
    }
  })
})
