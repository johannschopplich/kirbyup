import { relative, resolve } from 'node:path'
import process from 'node:process'
import { WriteStream } from 'node:tty'
import { gzipSync } from 'node:zlib'
import { Ansis } from 'ansis'
import { normalizePath } from 'vite'
import { name, version } from '../../package.json'

// Every line goes to stderr, matching `log.ts`.

/**
 * Follows the rule `styleText` applies, so this output and utilful's `log`
 * agree: a terminal or `FORCE_COLOR`, never `NO_COLOR`. On its own, ansis
 * would color a pipe as soon as `COLORTERM` is set.
 */
function colorLevel(stream: NodeJS.WriteStream): 0 | 1 | 2 | 3 {
  if (!stream.isTTY && process.env.FORCE_COLOR === undefined)
    return 0

  const depth = WriteStream.prototype.getColorDepth.call(stream)
  return depth >= 24 ? 3 : depth >= 8 ? 2 : depth >= 4 ? 1 : 0
}

const ansis = new Ansis(colorLevel(process.stderr))
const brand = ansis.hex('#f67f2f')
const badge = ansis.bgHex('#f67f2f').black

/** U+279C. */
const ARROW = '➜'

const INDENT = '  '

export function banner(action: string, subject?: string): void {
  const status = subject === undefined
    ? ansis.dim(action)
    : `${ansis.dim(action)} ${ansis.cyan(subject)}`

  console.error(`${badge(` ${name} `)} ${brand(`v${version}`)}  ${status}`)
}

export function blankLine(): void {
  console.error('')
}

export function aside(message: string): void {
  console.error(`${INDENT}${ansis.dim(message)}`)
}

export function fileWritten(
  { root, outDir, filePath, content, type, maxLength }: {
    root: string
    outDir: string
    filePath: string
    content: string
    type: string
    maxLength: number
  },
): void {
  const prettyOutDir = `${normalizePath(relative(root, outDir))}/`
  const kibs = content.length / 1024
  const compressedKibs = gzipSync(content).length / 1024
  const paint = type === 'chunk' ? ansis.cyan : ansis.magenta

  console.error(
    `${INDENT}${ansis.green(ARROW)}  ${ansis.dim(prettyOutDir)}${ansis.bold(paint(filePath.padEnd(maxLength + 2)))}`
    + `${ansis.dim(`${kibs.toFixed(2)} kB`)} ${ansis.gray('·')} ${ansis.dim(`gzip ${compressedKibs.toFixed(2)} kB`)}`,
  )
}

export function serverReady(
  { root, url, outDir, devFilename, watchPaths, startedAt }: {
    root: string
    url: string
    outDir: string | undefined
    devFilename: string
    watchPaths: string[]
    startedAt: number
  },
): void {
  const devIndex = normalizePath(relative(root, resolve(root, outDir ?? '', devFilename)))
  const labelWidth = 'Watching'.length

  row('Server', ansis.cyan(ansis.link(url)), labelWidth)
  row('Plugin', ansis.dim(devIndex), labelWidth)
  if (watchPaths.length > 0)
    row('Watching', ansis.dim(watchPaths.join(', ')), labelWidth)

  blankLine()
  aside(`ready in ${elapsed(startedAt)} – open the Panel and your changes appear as you save`)
  aside(`stop with ${ansis.bold('Ctrl-C')}`)
}

export function watching(paths: string[]): void {
  row('Watching', ansis.dim(paths.join(', ')), 'Watching'.length)
}

export function fileChanged(event: string, file: string): void {
  console.error(`${INDENT}${ansis.green(ARROW)}  ${ansis.bold(file)} ${ansis.dim(event)}`)
}

export function fullReload(file: string): void {
  console.error(`${INDENT}${ansis.green(ARROW)}  ${ansis.bold(file)} ${ansis.dim('changed, reloading the Panel')}`)
}

export function configChanged(file: string): void {
  console.error(`${INDENT}${ansis.green(ARROW)}  ${ansis.bold(file)} ${ansis.dim('changed, reloading the config')}`)
}

export function elapsed(startedAt: number): string {
  const milliseconds = Math.round(performance.now() - startedAt)
  return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(2)} s`
}

function row(label: string, value: string, labelWidth: number): void {
  console.error(`${INDENT}${ansis.green(ARROW)}  ${ansis.bold(`${label}:`.padEnd(labelWidth + 1))} ${value}`)
}
