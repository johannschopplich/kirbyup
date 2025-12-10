import { describe, expect, it } from 'vitest'
import { kirbyupHmrPlugin } from '../src/node/plugins/hmr'

describe('hmr plugin transform', () => {
  const plugin = kirbyupHmrPlugin({
    cwd: process.cwd(),
    entry: 'src/index.ts',
    watch: false,
    port: 3000,
  })
  const transform = plugin.transform as (code: string, id: string) => { code: string, map: null } | undefined

  it('injects HMR code into Vue components with HMR', () => {
    const mockCode = `_sfc_main.__hmrId = "abc123"
typeof __VUE_HMR_RUNTIME__ !== 'undefined' && __VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)
import.meta.hot.accept(mod => {
  if (!mod) return
  const { default: updated, _rerender_only } = mod
  if (_rerender_only) {
    __VUE_HMR_RUNTIME__.rerender(updated.__hmrId, updated.render)
  } else {
    __VUE_HMR_RUNTIME__.reload(updated.__hmrId, updated)
  }
})`

    const result = transform(mockCode, '/path/to/Component.vue')

    expect(result).toBeDefined()
    expect(result!.code).toContain('__KIRBYUP_HMR_WRAPPED__')
    expect(result!.code).toContain('$_applyKirbyModifications')
    expect(result!.code).toContain('$_syncKirbyComponent')
    expect(result!.code).toContain('$_getHmrRecord')

    // Verify injection happens before import.meta.hot.accept
    const injectionIndex = result!.code.indexOf('__KIRBYUP_HMR_WRAPPED__')
    const acceptIndex = result!.code.indexOf('import.meta.hot.accept')
    expect(injectionIndex).toBeLessThan(acceptIndex)
    expect(injectionIndex).toBeGreaterThan(-1)
  })

  it('skips non-Vue files', () => {
    const mockCode = 'export const foo = "bar"'
    const result = transform(mockCode, '/path/to/file.ts')

    expect(result).toBeUndefined()
  })

  it('skips Vue components without HMR createRecord', () => {
    const mockCode = 'export default { name: "Component" }'
    const result = transform(mockCode, '/path/to/Component.vue')

    expect(result).toBeUndefined()
  })

  it('skips components without import.meta.hot.accept', () => {
    const mockCode = `_sfc_main.__hmrId = "abc123"
__VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)`

    const result = transform(mockCode, '/path/to/Component.vue')

    expect(result).toBeUndefined()
  })

  it('matches snapshot', () => {
    const mockCode = `_sfc_main.__hmrId = "test-id"
__VUE_HMR_RUNTIME__.createRecord(_sfc_main.__hmrId, _sfc_main)
import.meta.hot.accept(mod => {})`

    const result = transform(mockCode, '/path/to/Component.vue')

    expect(result).toBeDefined()
    expect(result!.code).toMatchSnapshot()
  })
})
