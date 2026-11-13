import type { ServerOptions as HttpsServerOptions } from 'node:https'
import { isIP } from 'node:net'

export type HostValue = string | boolean | undefined

// A browser cannot reach a wildcard address, so the origin names `localhost`, as Vite's own local URL does.
const WILDCARD_HOSTS = new Set(['0.0.0.0', '::'])

export function resolveOriginFromServerOptions(
  serverOptions: {
    host?: HostValue
    https?: boolean | HttpsServerOptions
  } | undefined,
  port: number,
  fallbackHostname?: string,
): string {
  const protocol: 'http' | 'https' = serverOptions?.https && (typeof serverOptions.https === 'boolean' || Object.keys(serverOptions.https).length > 0)
    ? 'https'
    : 'http'
  const configuredHost = normalizeHost(serverOptions?.host)
  const hostname = formatHostname(configuredHost || fallbackHostname || 'localhost')
  const hostAlreadyHasPort = configuredHost ? hostIncludesPort(configuredHost) : false
  const isDefaultPort = (protocol === 'http' && port === 80) || (protocol === 'https' && port === 443)
  const portSuffix = hostAlreadyHasPort || isDefaultPort ? '' : `:${port}`

  return `${protocol}://${hostname}${portSuffix}`
}

function normalizeHost(host?: HostValue): string | undefined {
  if (typeof host !== 'string' || WILDCARD_HOSTS.has(host))
    return
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
