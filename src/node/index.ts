import { resolve, dirname } from 'pathe'
import { existsSync } from 'fs'
import { build as viteBuild } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import kirbyupAutoImportPlugin from './plugins/autoImport'
import postcssrc from 'postcss-load-config'
// @ts-expect-error: types are not available
import postcssLogical from 'postcss-logical'
// @ts-expect-error: types are not available
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'
import consola from 'consola'
import { cyan, dim, green, white } from 'colorette'
import { handleError, PrettyError } from './errors'
import { arraify, debouncePromise, printFileInfo } from './utils'
import { name, version } from '../../package.json'
import type { Awaited } from 'ts-essentials'
import type { RollupOutput, OutputChunk } from 'rollup'
import type {
  CliOptions,
  ResolvedCliOptions,
  PostCSSConfigResult
} from './types'

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

export async function runViteBuild(options: ResolvedCliOptions) {
  let result: Awaited<ReturnType<typeof viteBuild>> | undefined

  const mode = options.watch ? 'development' : 'production'
  const root = process.cwd()
  const outDir = options.outDir ?? root
  const aliasDir = resolve(root, dirname(options.entry))

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
          '~/': `${aliasDir}/`,
          '@/': `${aliasDir}/`
        }
      },
      css: {
        postcss: await resolvePostcssConfig(root)
      },
      envPrefix: ['VITE_', 'KIRBYUP_'],
      logLevel: 'warn'
    })
  } catch (error) {
    consola.error('Build failed')

    if (mode === 'production') {
      throw error
    }
  }

  if (result && !options.watch) {
    const { output } = arraify(result as RollupOutput[])[0]
    for (const { fileName, type, code } of output as OutputChunk[]) {
      printFileInfo(root, outDir, fileName, type, code)
    }
  }

  return result
}

export async function resolveOptions(options: CliOptions) {
  if (!options.entry) {
    throw new PrettyError(
      'No input file, try ' + cyan(`${name} <path/to/file.js>`)
    )
  }

  // Ensure entry exists
  if (!existsSync(options.entry)) {
    throw new PrettyError(`Cannot find ${options.entry}`)
  }

  return options as ResolvedCliOptions
}

export async function build(_options: CliOptions) {
  const options = await resolveOptions(_options)

  consola.log(green(`${name} v${version}`))
  consola.start('Building ' + cyan(options.entry))

  if (options.watch) {
    consola.info('Running in watch mode')
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

    consola.info(
      'Watching for changes in ' +
        arraify(watchPaths)
          .map((i) => cyan(i))
          .join(', ')
    )

    const watcher = watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored
    })

    watcher.on('all', async (type, file) => {
      consola.log(green(type) + ' ' + white(dim(file)))
      debouncedBuild()
    })
  }

  await runViteBuild(options)
  consola.success('Build successful')

  startWatcher()
}
