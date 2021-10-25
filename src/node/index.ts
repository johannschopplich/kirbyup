import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import { build as viteBuild } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import kirbyupAutoImportPlugin from './plugins/autoImport'
import postcssrc from 'postcss-load-config'
import postcssLogical from 'postcss-logical'
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'
import { white, dim, green, yellow } from 'colorette'
import { handleError, PrettyError } from './errors'
import { arraify, debouncePromise, printFileInfo } from './utils'
import { log, LogLevel } from './log'
import { name, version } from '../../package.json'
import type { Awaited } from 'ts-essentials'
import type { RollupOutput, OutputChunk } from 'rollup'
import type { Options, NormalizedOptions, PostCSSConfigResult } from './types'

let postcssConfigCache: PostCSSConfigResult

async function resolvePostcssConfig(
  root: string
): Promise<PostCSSConfigResult> {
  let result = postcssConfigCache
  if (result) {
    return result
  }

  try {
    // @ts-ignore
    result = await postcssrc({}, root)
  } catch (err: any) {
    if (!/No PostCSS Config found/.test(err.message)) {
      throw err
    }

    result = {
      plugins: [postcssLogical(), postcssDirPseudoClass()]
    }
  }

  postcssConfigCache = result
  return result
}

export async function runViteBuild(options: NormalizedOptions) {
  let result: Awaited<ReturnType<typeof viteBuild>> | undefined

  const mode = options.watch ? 'development' : 'production'
  const root = process.cwd()
  const outDir = options.outDir ?? root

  try {
    result = await viteBuild({
      mode,
      plugins: [createVuePlugin(), kirbyupAutoImportPlugin()],
      build: {
        lib: {
          entry: resolve(root, options.entry),
          formats: ['iife'],
          name: 'kirbyupExport',
          fileName: () => 'index.js'
        },
        minify: mode === 'production',
        outDir,
        emptyOutDir: false,
        rollupOptions: {
          external: ['vue'],
          output: {
            assetFileNames: 'index.[ext]',
            globals: {
              vue: 'Vue'
            }
          }
        }
      },
      resolve: {
        alias: {
          '~/': `${resolve(root, dirname(options.entry))}/`
        }
      },
      css: {
        postcss: await resolvePostcssConfig(root)
      },
      envPrefix: ['VITE_', 'KIRBYUP_'],
      logLevel: 'warn'
    })
  } catch (error) {
    log('Build failed', LogLevel.ERROR)

    if (mode === 'production') {
      throw error
    }
  }

  if (result) {
    log(`${green('✓')} Build successful`)

    if (!options.watch) {
      const { output } = arraify(result as RollupOutput[])[0]
      for (const { fileName, type, code } of output as OutputChunk[]) {
        printFileInfo(root, outDir, fileName, type, code)
      }
    }
  }

  return result
}

const normalizeOptions = async (options: Options) => {
  if (!options.entry) {
    throw new PrettyError(`No input file, try "${name} <path/to/file.js>"`)
  }

  // Ensure entry exists
  if (!existsSync(options.entry)) {
    throw new PrettyError(`Cannot find ${options.entry}`)
  }

  return options as NormalizedOptions
}

export async function build(_options: Options) {
  const options = await normalizeOptions(_options)

  log(`${name} v${version}`)
  log(yellow('Building') + ' ' + white(dim(options.entry)))

  if (options.watch) {
    log('Running in watch mode', LogLevel.INFO)
  }

  const debouncedBuild = debouncePromise(
    async () => {
      runViteBuild(options)
    },
    100,
    handleError
  )

  const startWatcher = async () => {
    if (!options.watch) return

    const { watch } = await import('chokidar')

    const ignored = [
      '**/{.git,node_modules}/**',
      // Always ignore out files
      'index.{css,js}'
    ]

    const watchPaths =
      typeof options.watch === 'boolean'
        ? dirname(options.entry)
        : Array.isArray(options.watch)
        ? options.watch.filter(
            (path): path is string => typeof path === 'string'
          )
        : options.watch

    log(
      yellow('Watching for changes in ') +
        white(
          dim(Array.isArray(watchPaths) ? watchPaths.join(', ') : watchPaths)
        )
    )

    // log(
    //   yellow('Ignoring changes in ') + white(dim(ignored.join(', '))),
    //   LogLevel.INFO
    // )

    const watcher = watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored
    })

    watcher.on('all', async (type, file) => {
      log(yellow(`${type}:`) + ' ' + white(dim(file)))
      debouncedBuild()
    })
  }

  await runViteBuild(options)

  startWatcher()
}
