import fs from 'fs-extra'
import path from 'pathe'
import { gzip } from 'zlib'
import { promisify } from 'util'
import consola from 'consola'
import { cyan, dim, magenta, white } from 'colorette'

const compress = promisify(gzip)

export function arraify<T>(target: T | T[]): T[] {
  return Array.isArray(target) ? target : [target]
}

export async function getCompressedSize(code: string | Uint8Array) {
  const size =
    (await compress(typeof code === 'string' ? code : Buffer.from(code)))
      .length / 1024
  return ` / gzip: ${size.toFixed(2)} KiB`
}

export async function printFileInfo(
  root: string,
  outDir: string,
  filePath: string,
  type: string,
  content?: string
) {
  content ??= await fs.readFile(path.resolve(outDir, filePath), 'utf8')
  const prettyOutDir =
    path.normalize(path.relative(root, path.resolve(root, outDir))) + '/'
  const kibs = content.length / 1024
  const compressedSize = await getCompressedSize(content)
  const writeColor = type === 'chunk' ? cyan : magenta

  consola.log(
    white(dim(prettyOutDir)) +
      writeColor(filePath) +
      '   ' +
      dim(`${kibs.toFixed(2)} KiB${compressedSize}`)
  )
}

export function debouncePromise<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  delay: number,
  onError: (err: unknown) => void
) {
  let timeout: ReturnType<typeof setTimeout> | undefined
  let promiseInFly: Promise<void> | undefined
  let callbackPending: (() => void) | undefined

  return function debounced(...args: Parameters<typeof fn>) {
    if (promiseInFly) {
      callbackPending = () => {
        debounced(...args)
        callbackPending = undefined
      }
    } else {
      if (timeout) clearTimeout(timeout)

      timeout = setTimeout(() => {
        timeout = undefined
        promiseInFly = fn(...args)
          .catch(onError)
          .finally(() => {
            promiseInFly = undefined
            if (callbackPending) callbackPending()
          })
      }, delay)
    }
  }
}
