import type { ServerOptions as HttpsServerOptions } from 'node:https'
import { isIP } from 'node:net'

export type HostValue = string | boolean | undefined

export function resolveOriginFromServerOptions(
  serverOptions: {
    host?: HostValue
    https?: boolean | HttpsServerOptions
  } | undefined,
  port: number,
  fallbackHostname?: string,
): string {
  const protocol: 'http' | 'https'
    = serverOptions?.https && (typeof serverOptions.https === 'boolean' || Object.keys(serverOptions.https).length > 0)
      ? 'https'
      : 'http'
  const configuredHost = normalizeHost(serverOptions?.host)
  const hostname = formatHostname(configuredHost || fallbackHostname || 'localhost')
  const hostAlreadyHasPort = configuredHost ? hostIncludesPort(configuredHost) : false
  const portSuffix = hostAlreadyHasPort || !needsExplicitPort(protocol, port) ? '' : `:${port}`

  return `${protocol}://${hostname}${portSuffix}`
}

export function ensureTrailingSlash(url: string): string {
  return url.endsWith('/') ? url : `${url}/`
}

function normalizeHost(host?: HostValue): string | undefined {
  if (host === false || host === undefined)
    return
  if (host === true)
    return '0.0.0.0'
  return host
}

function formatHostname(host: string): string {
  if (!host)
    return 'localhost'
  if (host.startsWith('[') && host.endsWith(']'))
    return host
  return isIP(host) === 6 ? `[${host}]` : host
}

function hostIncludesPort(host: string): boolean {
  if (host.startsWith('[')) {
    const closingIndex = host.indexOf(']')
    return closingIndex > -1 && host.slice(closingIndex + 1).startsWith(':')
  }
  if (isIP(host) === 6)
    return false
  return host.includes(':')
}

function needsExplicitPort(protocol: 'http' | 'https', port: number): boolean {
  if (protocol === 'http')
    return port !== 80
  return port !== 443
}
