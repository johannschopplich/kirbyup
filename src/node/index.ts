import type { OutputChunk, RollupOutput } from 'rollup'
import type { InlineConfig, LogLevel } from 'vite'
import type { BaseOptions, BuildOptions, PostCSSConfigResult, ServeOptions, UserConfig } from './types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import vuePlugin from '@vitejs/plugin-vue2'
import vueJsxPlugin from '@vitejs/plugin-vue2-jsx'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import { basename, dirname, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'
import externalGlobals from 'rollup-plugin-external-globals'
import { build as _build, createLogger, createServer, mergeConfig } from 'vite'
import fullReloadPlugin from 'vite-plugin-full-reload'
import * as vueCompilerSfc from 'vue/compiler-sfc'
import { name, version } from '../../package.json'
import { loadConfig, resolvePostCSSConfig } from './config'
import { handleError, PrettyError } from './errors'
import kirbyupBuildCleanupPlugin from './plugins/build-cleanup'
import kirbyupGlobImportPlugin from './plugins/glob-import'
import kirbyupHmrPlugin from './plugins/hmr'
import { printFileInfo, toArray } from './utils'

let resolvedKirbyupConfig: UserConfig
let resolvedPostCssConfig: PostCSSConfigResult | undefined

const logLevel: LogLevel = 'warn'
const logger = createLogger(logLevel)
const loggerWarn = logger.warn

// Overwrite log function to ignore output directory warning
logger.warn = (msg, options) => {
  if (msg.includes('(!) build.outDir'))
    return

  loggerWarn(msg, options)
}

function getViteConfig(command: 'build', options: BuildOptions): InlineConfig
function getViteConfig(command: 'serve', options: ServeOptions): InlineConfig
function getViteConfig(
  command: string,
  options: BuildOptions | ServeOptions,
): InlineConfig {
  const aliasDir = resolve(options.cwd, dirname(options.entry))
  const { alias = {}, vite, extendViteConfig } = resolvedKirbyupConfig
  const userConfig = vite ?? extendViteConfig ?? {}

  const sharedConfig: InlineConfig = {
    resolve: {
      alias: {
        '~/': `${aliasDir}/`,
        '@/': `${aliasDir}/`,
        ...alias,
      },
    },
    plugins: [
      // Explicitly pass the compiler, since the plugin's resolving of the compiler
      // looks in the current directory and breaks `npx kirbyup`
      vuePlugin({ compiler: vueCompilerSfc }),
      vueJsxPlugin(),
      kirbyupGlobImportPlugin(),
      { ...externalGlobals({ vue: 'Vue' }), enforce: 'post' },
    ],
    build: {
      copyPublicDir: false,
    },
    ...(resolvedPostCssConfig && {
      css: {
        postcss: resolvedPostCssConfig,
      },
    }),
    envDir: options.cwd,
    envPrefix: ['VITE_', 'KIRBYUP_'],
    customLogger: logger,
    logLevel,
  }

  if (command === 'serve') {
    const { port, watch } = options as ServeOptions

    const serveConfig: InlineConfig = mergeConfig(sharedConfig, {
      plugins: [
        kirbyupHmrPlugin(options as ServeOptions),
        watch && fullReloadPlugin(watch),
      ].filter(Boolean),
      // Input needs to be specified so dependency pre-bundling works
      build: {
        rollupOptions: {
          input: resolve(options.cwd, options.entry),
        },
      },
      // Specify origin so asset URLs include Vite server host
      server: {
        port,
        strictPort: true,
        origin: `http://localhost:${port}`,
      },
    })

    return mergeConfig(serveConfig, userConfig)
  }

  const mode = options.watch ? 'development' : 'production'

  const buildConfig: InlineConfig = mergeConfig(sharedConfig, {
    mode,
    plugins: [kirbyupBuildCleanupPlugin(options as BuildOptions)],
    build: {
      lib: {
        entry: resolve(options.cwd, options.entry),
        formats: ['iife'],
        name: 'kirbyupExport',
        fileName: () => 'index.js',
      },
      minify: mode === 'production',
      outDir: options.outDir,
      emptyOutDir: false,
      rollupOptions: {
        output: {
          assetFileNames: 'index.[ext]',
        },
      },
    },
  })

  return mergeConfig(buildConfig, userConfig)
}

async function generate(options: BuildOptions) {
  const config = getViteConfig('build', options)

  let result: Awaited<ReturnType<typeof _build>> | undefined

  try {
    result = await _build(config)
  }
  catch (error) {
    consola.error('Build failed')

    if (config.mode === 'production')
      throw error
  }

  if (result && !options.watch) {
    const { output } = toArray(result as RollupOutput)[0]!

    let maxLength = 0
    for (const chunkFile in output) {
      const fileNameLength = output[chunkFile]!.fileName.length
      if (fileNameLength > maxLength)
        maxLength = fileNameLength
    }

    for (const { fileName, type, code } of (output as OutputChunk[])) {
      const content = code || (await fsp.readFile(resolve(options.outDir, fileName), 'utf8'))

      await printFileInfo(
        {
          root: options.cwd,
          outDir: options.outDir,
          filePath: fileName,
          content,
          type,
          maxLength,
        },
      )
    }
  }

  return result
}

export async function build(options: BuildOptions) {
  assertEntryExists(options)

  const { cwd } = options

  // Resolve kirbyup config
  const { config, configFile } = await loadConfig(cwd)
  resolvedKirbyupConfig = config ?? {}

  // Resolve PostCSS config
  resolvedPostCssConfig = await resolvePostCSSConfig(cwd)

  if (!process.env.VITEST) {
    // Start kirbyup
    consola.log(colors.green(`${name} v${version}`))
    consola.start(`Building ${colors.cyan(options.entry)}`)
  }

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
      // Always ignore dist files
      'index.{css,js}',
    ]

    const watchPaths = typeof options.watch === 'boolean'
      ? dirname(options.entry)
      : Array.isArray(options.watch)
        ? options.watch.filter(
            (path): path is string => typeof path === 'string',
          )
        : options.watch

    consola.info(
      `Watching for changes in ${toArray(watchPaths)
        .map(i => colors.cyan(i))
        .join(', ')}`,
    )

    const watcher = watch(watchPaths, {
      ignoreInitial: true,
      ignorePermissionErrors: true,
      ignored,
      cwd,
    })

    if (configFile)
      watcher.add(configFile)

    watcher.on('all', async (type, file) => {
      const absolutePath = resolve(cwd, file)

      if (configFile === absolutePath) {
        resolvedKirbyupConfig = (await loadConfig(cwd)).config ?? {}
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

  if (!process.env.VITEST)
    consola.success('Build successful')

  startWatcher()
}

export async function serve(options: ServeOptions) {
  assertEntryExists(options)

  const { cwd } = options

  // Resolve kirbyup config
  const { config } = await loadConfig(cwd)
  resolvedKirbyupConfig = config ?? {}

  // Resolve PostCSS config
  resolvedPostCssConfig = await resolvePostCSSConfig(cwd)

  if (!process.env.VITEST) {
    consola.log(colors.green(`${name} v${version}`))
    consola.info('Starting development server...')
  }

  const server = await createServer(getViteConfig('serve', options))

  await server.listen()
  if (!process.env.VITEST)
    consola.success(`Server is listening on :${server.config.server.port}`)

  return server
}

function assertEntryExists(options: BaseOptions) {
  if (!fs.existsSync(resolve(options.cwd, options.entry)))
    throw new PrettyError(`Cannot find "${options.entry}"`)
}
