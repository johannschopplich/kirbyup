import { existsSync } from 'node:fs'
import { basename, dirname, resolve } from 'pathe'
import { build as _build, mergeConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
// eslint-disable-next-line import/default
import postcssrc from 'postcss-load-config'
// @ts-expect-error: types not available
import postcssLogical from 'postcss-logical'
// @ts-expect-error: types not available
import postcssDirPseudoClass from 'postcss-dir-pseudo-class'
import consola from 'consola'
import { debounce } from 'perfect-debounce'
import colors from 'picocolors'
import type { OutputChunk, RollupOutput } from 'rollup'
import type { InlineConfig } from 'vite'
import { name, version } from '../../package.json'
import { PrettyError, handleError } from './errors'
import { printFileInfo, toArray } from './utils'
import { loadConfig } from './config'
import kirbyupAutoImportPlugin from './plugins/autoImport'
import type {
  CliOptions,
  PostCSSConfigResult,
  ResolvedCliOptions,
  UserConfig,
} from './types'

let resolvedKirbyupConfig: UserConfig
let resolvedPostCssConfig: PostCSSConfigResult

async function generate(options: ResolvedCliOptions) {
  let result: Awaited<ReturnType<typeof _build>> | undefined

  const mode = options.watch ? 'development' : 'production'
  const outDir = options.outDir || options.cwd
  const aliasDir = resolve(options.cwd, dirname(options.entry))
  const { alias = {}, extendViteConfig = {} } = resolvedKirbyupConfig

  const defaultConfig: InlineConfig = {
    mode,
    plugins: [createVuePlugin(), kirbyupAutoImportPlugin()],
    build: {
      lib: {
        entry: resolve(options.cwd, options.entry),
        formats: ['iife'],
        name: 'kirbyupExport',
        fileName: () => 'index.js',
      },
      minify: mode === 'production',
      outDir,
      emptyOutDir: false,
      rollupOptions: {
        external: ['vue'],
        output: {
          assetFileNames: 'index.[ext]',
          globals: {
            vue: 'Vue',
          },
        },
      },
    },
    resolve: {
      alias: {
        '~/': `${aliasDir}/`,
        '@/': `${aliasDir}/`,
        ...alias,
      },
    },
    css: {
      postcss: resolvedPostCssConfig,
    },
    envPrefix: ['VITE_', 'KIRBYUP_'],
    logLevel: 'warn',
  }

  try {
    result = await _build(mergeConfig(defaultConfig, extendViteConfig))
  }
  catch (error) {
    consola.error('Build failed')

    if (mode === 'production')
      throw error
  }

  if (result && !options.watch) {
    const { output } = toArray(result as RollupOutput)[0]
    for (const { fileName, type, code } of output as OutputChunk[])
      printFileInfo(options.cwd, outDir, fileName, type, code)
  }

  return result
}

export async function resolveOptions(options: CliOptions) {
  options.cwd = options.cwd || process.cwd()

  if (!options.entry) {
    throw new PrettyError(
      `No input file, try ${colors.cyan(`${name} <path/to/file.js>`)}`,
    )
  }

  // Ensure entry exists
  if (!existsSync(resolve(options.cwd, options.entry)))
    throw new PrettyError(`Cannot find "${options.entry}"`)

  return options as ResolvedCliOptions
}

export async function build(_options: CliOptions) {
  const options = await resolveOptions(_options)
  const { cwd } = options

  // Resolve kirbyup config
  const { config, sources: configSources } = await loadConfig(cwd)
  resolvedKirbyupConfig = config

  // Resolve postcss config
  try {
    // @ts-expect-error: types won't match
    resolvedPostCssConfig = await postcssrc({})
  }
  catch (err: any) {
    if (!/No PostCSS Config found/.test(err.message))
      throw err

    resolvedPostCssConfig = {
      plugins: [postcssLogical(), postcssDirPseudoClass()],
    }
  }

  // Start kirbyup
  consola.log(colors.green(`${name} v${version}`))
  consola.start(`Building ${colors.cyan(options.entry)}`)

  if (options.watch)
    consola.info('Running in watch mode')

  const debouncedBuild = debounce(async () => {
    generate(options).catch(handleError)
  }, 100)

  const startWatcher = async () => {
    if (!options.watch)
      return

    const { watch } = await import('chokidar')

    const ignored = [
      '**/{.git,node_modules}/**',
      // Always ignore out files
      'index.{css,js}',
    ]

    const watchPaths
      = typeof options.watch === 'boolean'
        ? dirname(options.entry)
        : Array.isArray(options.watch)
          ? options.watch.filter(
            (path): path is string => typeof path === 'string',
          )
          : options.watch

    consola.info(
      `Watching for changes in ${
        toArray(watchPaths)
          .map(i => colors.cyan(i))
          .join(', ')}`,
    )

    const watcher = watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored,
      cwd,
    })

    if (configSources.length)
      watcher.add(configSources)

    watcher.on('all', async (type, file) => {
      if (configSources.includes(file)) {
        resolvedKirbyupConfig = (await loadConfig()).config
        consola.info(
          `${colors.cyan(basename(file))} changed, setting new config`,
        )
      }
      else {
        consola.log(`${colors.green(type)} ${colors.white(colors.dim(file))}`)
      }

      debouncedBuild()
    })
  }

  await generate(options)
  consola.success('Build successful')

  startWatcher()
}

export { defineConfig } from './config'
