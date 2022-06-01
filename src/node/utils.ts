import { normalize, relative, resolve } from 'pathe'
import { readFile } from 'fs/promises'
import { gzip } from 'zlib'
import { promisify } from 'util'
import consola from 'consola'
import colors from 'picocolors'

export function toArray<T>(array?: T | T[]): T[] {
  array = array || []
  if (Array.isArray(array)) return array
  return [array]
}

const compress = promisify(gzip)

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
  content ??= await readFile(resolve(outDir, filePath), 'utf8')
  const prettyOutDir = normalize(relative(root, resolve(root, outDir))) + '/'
  const kibs = content.length / 1024
  const compressedSize = await getCompressedSize(content)
  const writeColor = type === 'chunk' ? colors.cyan : colors.magenta

  consola.log(
    colors.white(colors.dim(prettyOutDir)) +
      writeColor(filePath) +
      '   ' +
      colors.dim(`${kibs.toFixed(2)} KiB${compressedSize}`)
  )
}
