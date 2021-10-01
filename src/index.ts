import { resolve, dirname } from 'path'
import { existsSync } from 'fs'
import colors from 'nanocolors'
import { build as viteBuild } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { handleError, PrettyError } from './errors'
import { debouncePromise } from './utils'
import { log } from './log'
import { name, version } from '../package.json'
import type { Awaited } from 'ts-essentials'
import type { Options, NormalizedOptions } from './types'

export async function runViteBuild(options: NormalizedOptions) {
  let result: Awaited<ReturnType<typeof viteBuild>> | undefined

  const mode = options.watch ? 'development' : 'production'

  try {
    result = await viteBuild({
      mode,
      plugins: [createVuePlugin()],
      build: {
        lib: {
          entry: resolve(process.cwd(), options.entry),
          formats: ['iife'],
          name: 'kirbyupExport',
          fileName: () => 'index.js'
        },
        minify: mode === 'production' && 'terser',
        outDir: options.outDir ?? process.cwd(),
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
      envPrefix: ['VITE_', 'KIRBYUP_'],
      logLevel: 'warn'
    })
  } catch (error) {
    log('Build failed', 'error')
    throw error
  }

  log('Build successful', 'success')
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
  log(`Building: ${options.entry}`)

  if (options.watch) {
    log('Running in watch mode')
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
      `Watching for changes in ${
        Array.isArray(watchPaths)
          ? watchPaths.map((i) => `"${i}"`).join(' | ')
          : `"${watchPaths}"`
      }`
    )

    // log(`Ignoring changes in ${ignored.map((i) => `"${i}"`).join(' | ')}`)

    const watcher = watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored
    })

    watcher.on('all', async (type, file) => {
      log(`${type} ${colors.gray(file)}`)
      debouncedBuild()
    })
  }

  await runViteBuild(options)

  startWatcher()
}
