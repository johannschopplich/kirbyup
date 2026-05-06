import { relative } from 'node:path'
import { gzipSync } from 'node:zlib'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import { normalizePath } from 'vite'

export function toArray<T>(array?: T | T[]): T[] {
  array ??= []
  return Array.isArray(array) ? array : [array]
}

export async function printFileInfo(
  {
    root,
    outDir,
    filePath,
    content,
    type,
    maxLength,
  }: {
    root: string
    outDir: string
    filePath: string
    content: string
    type: string
    maxLength: number
  },
): Promise<void> {
  const prettyOutDir = `${normalizePath(relative(root, outDir))}/`
  const kibs = content.length / 1024
  const compressedKibs = gzipSync(content).length / 1024
  const writeColor = type === 'chunk' ? colors.cyan : colors.magenta

  consola.log(
    colors.white(colors.dim(prettyOutDir))
    + writeColor(filePath.padEnd(maxLength + 2))
    + colors.dim(`${kibs.toFixed(2)} kB / gzip: ${compressedKibs.toFixed(2)} KiB`),
  )
}
