import type { Plugin } from 'vite'
import { describe, expect, it } from 'vitest'
import { kirbyupHmrPlugin } from '../src/node/plugins/hmr'
import { extractEsmNamedExports } from '../src/node/plugins/utils'

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
