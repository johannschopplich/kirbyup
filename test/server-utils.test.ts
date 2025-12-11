import { describe, expect, it } from 'vitest'
import { resolveOriginFromServerOptions } from '../src/node/utils/server'

describe('resolveOriginFromServerOptions', () => {
  it('resolves https origin omitting default port 443', () => {
    const origin = resolveOriginFromServerOptions({ host: 'sandbox.test', https: true }, 443)
    expect(origin).toBe('https://sandbox.test')
  })

  it('resolves http origin omitting default port 80', () => {
    const origin = resolveOriginFromServerOptions({ host: 'sandbox.test' }, 80)
    expect(origin).toBe('http://sandbox.test')
  })

  it('preserves custom port in host configuration', () => {
    const origin = resolveOriginFromServerOptions({ host: 'sandbox.test:8443', https: true }, 8443)
    expect(origin).toBe('https://sandbox.test:8443')
  })

  it('uses fallback hostname when server options undefined', () => {
    const origin = resolveOriginFromServerOptions(undefined, 5173, 'devbox.test')
    expect(origin).toBe('http://devbox.test:5173')
  })

  it('formats IPv6 addresses with brackets', () => {
    const origin = resolveOriginFromServerOptions({ host: '2001:db8::1' }, 3000)
    expect(origin).toBe('http://[2001:db8::1]:3000')
  })

  it('resolves host=true to 0.0.0.0', () => {
    const origin = resolveOriginFromServerOptions({ host: true }, 3000)
    expect(origin).toBe('http://0.0.0.0:3000')
  })

  it('uses http protocol for empty https configuration', () => {
    const origin = resolveOriginFromServerOptions({ host: 'sandbox.test', https: {} }, 3000)
    expect(origin).toBe('http://sandbox.test:3000')
  })
})
