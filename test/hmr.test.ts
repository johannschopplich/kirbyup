import type { Plugin } from 'vite'
import vm from 'node:vm'
import { describe, expect, it, vi } from 'vitest'
import { kirbyupHmrPlugin } from '../src/node/plugins/hmr.ts'
import { __HMR_SHIM_CODE__ } from '../src/node/plugins/utils.ts'

const SHIM_ID = '\0kirbyup:hmr-shim'
const VUE_STUB_ID = '\0kirbyup:vue-stub'

async function createPlugin(): Promise<Plugin> {
  const plugin = kirbyupHmrPlugin({
    cwd: process.cwd(),
    entry: 'src/index.ts',
    watch: false,
    port: 3000,
  })

  await (plugin.configResolved as (config: Record<string, any>) => Promise<void>).call(
    plugin,
    { root: process.cwd() },
  )

  return plugin
}

function callHook<R>(
  plugin: Plugin,
  name: 'transform' | 'load',
  ...args: any[]
): R {
  const hook = plugin[name] as any
  const handler = typeof hook === 'function' ? hook : hook.handler
  return handler.call(plugin, ...args)
}

describe('kirbyupHmrPlugin', () => {
  describe('vue stub', () => {
    it('re-exports ref and computed as named bindings', async () => {
      const plugin = await createPlugin()
      const { code } = callHook<{ code: string }>(plugin, 'load', VUE_STUB_ID)

      expect.soft(code).toMatch(/^\s*ref,$/m)
      expect.soft(code).toMatch(/^\s*computed,$/m)
    })

    it('omits a default export, as vue.esm-browser.js does', async () => {
      const plugin = await createPlugin()
      const { code } = callHook<{ code: string }>(plugin, 'load', VUE_STUB_ID)

      expect(code).not.toMatch(/\bexport\s+default\b/)
    })

    it('passes through unrelated ids', async () => {
      const plugin = await createPlugin()
      expect(callHook(plugin, 'load', '/path/to/Component.vue')).toBeUndefined()
      expect(callHook(plugin, 'load', '\0other:virtual')).toBeUndefined()
    })
  })

  describe('transform', () => {
    it('injects the shim import at the top of the entry', async () => {
      const plugin = await createPlugin()
      const entryId = `${process.cwd()}/src/index.ts`
      const code = `console.log('entry')`
      const result = callHook<{ code: string, map: null }>(plugin, 'transform', code, entryId)

      expect(result).toBeDefined()
      expect(result.code.startsWith(`import ${JSON.stringify(SHIM_ID)}`)).toBe(true)
      expect(result.code).toContain(code)
    })

    it('matches the entry id when it carries a query suffix', async () => {
      const plugin = await createPlugin()
      const entryId = `${process.cwd()}/src/index.ts?t=12345`
      const result = callHook<{ code: string, map: null }>(plugin, 'transform', `x`, entryId)

      expect(result).toBeDefined()
      expect(result.code.startsWith(`import ${JSON.stringify(SHIM_ID)}`)).toBe(true)
    })

    it('passes through non-entry files', async () => {
      const plugin = await createPlugin()
      expect(callHook(plugin, 'transform', `x`, '/some/other/file.ts')).toBeUndefined()
      expect(callHook(plugin, 'transform', `x`, '/path/to/Component.vue')).toBeUndefined()
    })

    it('skips entries that already import the shim', async () => {
      const plugin = await createPlugin()
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
  // Strip the side-effect `import 'vue'` – vm runs this as a Script, not a Module.
  const code = __HMR_SHIM_CODE__.replace(/import\s+['"]vue['"];?\s*/, '')
  const context = vm.createContext({
    window: globals.window,
    __VUE_HMR_RUNTIME__: globals.__VUE_HMR_RUNTIME__,
    console: globals.console,
  })
  vm.runInContext(code, context)
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

  it('runs the Kirby helpers in extension → render → mixins order', () => {
    const calls: string[] = []
    const sfc = { __hmrId: 'abc' }
    const runtime: ShimRuntime = { reload: vi.fn() }
    evalShim({
      window: { panel: { app: {}, plugins: {
        resolveComponentExtension: vi.fn(() => { calls.push('ext') }),
        resolveComponentRender: vi.fn(() => { calls.push('render') }),
        resolveComponentMixins: vi.fn(() => { calls.push('mix') }),
        components: { foo: sfc },
      } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('abc', sfc)
    expect(calls).toEqual(['ext', 'render', 'mix'])
  })

  it('delegates to the original reload after the helpers ran', () => {
    const sfc = { __hmrId: 'abc' }
    const originalReload = vi.fn()
    const runtime: ShimRuntime = { reload: originalReload }
    evalShim({
      window: { panel: { app: {}, plugins: {
        resolveComponentExtension: vi.fn(),
        resolveComponentRender: vi.fn(),
        resolveComponentMixins: vi.fn(),
        components: { foo: sfc },
      } } },
      __VUE_HMR_RUNTIME__: runtime,
      console: { warn: vi.fn() },
    })

    runtime.reload('abc', sfc)
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

  it('skips the helpers when no plugin component matches, and still delegates', () => {
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
