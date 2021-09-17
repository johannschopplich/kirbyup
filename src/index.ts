import fs from 'fs'
import path from 'path'
import { build as viteBuild } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { handleError, PrettyError } from './errors'
import { debouncePromise } from './utils'
import { log } from './log'
import { version } from '../package.json'
import type { RollupOutput, RollupWatcher } from 'rollup'
import type { MarkRequired } from 'ts-essentials'

export type Options = {
  entry?: string
  watch?: boolean | string | (string | boolean)[]
}

export type NormalizedOptions = MarkRequired<Options, 'entry'>

export async function runViteBuild(options: NormalizedOptions) {
  let result: RollupOutput | RollupOutput[] | RollupWatcher | undefined

  try {
    result = await viteBuild({
      plugins: [createVuePlugin()],
      build: {
        lib: {
          entry: path.resolve(process.cwd(), options.entry),
          formats: ['es'],
          fileName: 'index.js'
        },
        outDir: '.',
        rollupOptions: {
          external: ['vue'],
          output: {
            entryFileNames: '[name].js',
            assetFileNames: 'index.[ext]',
            globals: {
              vue: 'Vue'
            }
          }
        }
      },
      logLevel: 'error'
    })
  } catch (error) {
    log('error', 'Build failed')
    throw error
  }

  if (result) {
    log('success', `Build success`)
  }

  return result
}

const normalizeOptions = async (options: Options) => {
  if (!options.entry) {
    throw new PrettyError(`No input file, try "kirbyup <path/to/file.js>"`)
  }

  // Ensure entry exists
  if (!fs.existsSync(options.entry)) {
    throw new PrettyError(`Cannot find ${options.entry}`)
  }

  return options as NormalizedOptions
}

export async function build(_options: Options) {
  const options = await normalizeOptions(_options)

  log('info', `kirbyup v${version}`)
  log('info', `Building: ${options.entry}`)

  if (options.watch) {
    log('info', 'Running in watch mode')
  }

  const debouncedBuildAll = debouncePromise(
    async () => {
      runViteBuild(options)
    },
    100,
    handleError
  )

  const startWatcher = async () => {
    if (!options.watch) return

    const { watch } = await import('chokidar')

    const ignored = ['**/{.git,node_modules}/**']

    const watchPaths =
      typeof options.watch === 'boolean'
        ? path.dirname(options.entry)
        : Array.isArray(options.watch)
        ? options.watch.filter(
            (path): path is string => typeof path === 'string'
          )
        : options.watch

    log(
      'info',
      `Watching for changes in ${
        Array.isArray(watchPaths)
          ? watchPaths.map((v) => '"' + v + '"').join(' | ')
          : '"' + watchPaths + '"'
      }`
    )
    // log(
    //   'info',
    //   `Ignoring changes in ${ignored.map((v) => '"' + v + '"').join(' | ')}`
    // )

    const watcher = watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored
    })

    watcher.on('all', async (type, file) => {
      log('info', `Change detected: ${type} ${file}`)
      debouncedBuildAll()
    })
  }

  await runViteBuild(options)

  startWatcher()
}
