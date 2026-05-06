import type { InlineConfig, LogLevel, Rolldown, ViteDevServer } from 'vite'
import type { BaseOptions, BuildOptions, PostCSSConfigResult, ServeOptions, UserConfig } from './types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import vuePlugin from '@vitejs/plugin-vue'
import vueJsxPlugin from '@vitejs/plugin-vue-jsx'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import { basename, dirname, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'
import { build as _build, createLogger, createServer, mergeConfig } from 'vite'
import fullReloadPlugin from 'vite-plugin-full-reload'
import * as vueCompilerSfc from 'vue/compiler-sfc'
import { name, version } from '../../package.json'
import { loadConfig, resolvePostCSSConfig } from './config'
import { handleError, PrettyError } from './errors'
import { kirbyupBuildCleanupPlugin, kirbyupHmrPlugin } from './plugins'
import { printFileInfo, toArray } from './utils'
import { resolveOriginFromServerOptions } from './utils/server'

const DEV_OUTPUT_FILENAME = 'index.dev.js'

let resolvedKirbyupConfig: UserConfig
let resolvedPostCssConfig: PostCSSConfigResult | undefined

const logLevel: LogLevel = 'warn'
const logger = createLogger(logLevel)
const loggerWarn = logger.warn

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
  const { alias = {}, vite } = resolvedKirbyupConfig
  const userConfig = vite ?? {}

  const sharedConfig: InlineConfig = {
    resolve: {
      alias: {
        '~/': `${aliasDir}/`,
        '@/': `${aliasDir}/`,
        ...alias,
      },
    },
    plugins: [
      // Pass compiler explicitly – plugin-vue's auto-resolution looks in cwd and breaks `npx kirbyup`.
      vuePlugin({ compiler: vueCompilerSfc }),
      vueJsxPlugin(),
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
    const inferredOrigin = userConfig.server?.origin ?? resolveOriginFromServerOptions(userConfig.server, port, 'localhost')

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
      server: {
        port,
        strictPort: true,
        origin: inferredOrigin,
        cors: true,
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
        formats: ['es'],
        fileName: () => options.watch ? DEV_OUTPUT_FILENAME : 'index.js',
      },
      minify: mode === 'production',
      outDir: options.outDir,
      emptyOutDir: false,
      rollupOptions: {
        external: ['vue'],
        output: {
          assetFileNames: 'index.[ext]',
        },
      },
    },
  })

  return mergeConfig(buildConfig, userConfig)
}

async function generate(options: BuildOptions): Promise<Rolldown.RolldownOutput | Rolldown.RolldownOutput[] | Rolldown.RolldownWatcher | undefined> {
  const config = getViteConfig('build', options)

  let result: Awaited<ReturnType<typeof _build>> | undefined

  try {
    result = await _build(config)
  }
  catch (error) {
    if (config.mode === 'production')
      throw error
    else
      consola.error(error)
  }

  if (result && !options.watch) {
    const { output } = toArray(result as Rolldown.RolldownOutput)[0]!

    let maxLength = 0
    for (const chunkFile in output) {
      const fileNameLength = output[chunkFile]!.fileName.length
      if (fileNameLength > maxLength)
        maxLength = fileNameLength
    }

    for (const { fileName, type, code } of (output as Rolldown.OutputChunk[])) {
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

export async function build(options: BuildOptions): Promise<void> {
  assertEntryExists(options)

  const { cwd } = options

  const { config, configFile } = await loadConfig(cwd)
  resolvedKirbyupConfig = config ?? {}

  resolvedPostCssConfig = await resolvePostCSSConfig(cwd)

  if (!process.env.VITEST) {
    consola.log(colors.green(`${name} v${version}`))
    consola.start(`Building ${colors.cyan(options.entry)}`)
  }

  if (options.watch)
    consola.info('Running in watch mode')

  await generate(options)

  if (!process.env.VITEST)
    consola.success('Build successful')

  if (!options.watch)
    return

  const { watch } = await import('chokidar')

  const debouncedBuild = debounce(async () => {
    generate(options).catch(handleError)
  }, 100)

  const ignored = [
    '**/{.git,node_modules}/**',
    'index.{css,js}',
    DEV_OUTPUT_FILENAME,
  ]

  const watchPaths = typeof options.watch === 'boolean'
    ? dirname(options.entry)
    : Array.isArray(options.watch)
      ? options.watch.filter((path): path is string => typeof path === 'string')
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

  const devOutputPath = resolve(options.outDir, DEV_OUTPUT_FILENAME)

  const cleanup = async () => {
    await watcher.close().catch(() => {})
    await fsp.rm(devOutputPath, { force: true }).catch(() => {})
  }

  // Sync fallback for abrupt exits
  process.once('exit', () => {
    try {
      fs.rmSync(devOutputPath, { force: true })
    }
    catch {}
  })

  const onShutdown = () => void cleanup().finally(() => process.exit(0))
  process.once('SIGINT', onShutdown)
  process.once('SIGTERM', onShutdown)

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

export async function serve(options: ServeOptions): Promise<ViteDevServer> {
  assertEntryExists(options)

  const { cwd } = options

  const { config } = await loadConfig(cwd)
  resolvedKirbyupConfig = config ?? {}

  resolvedPostCssConfig = await resolvePostCSSConfig(cwd)

  if (!process.env.VITEST) {
    consola.log(colors.green(`${name} v${version}`))
    consola.info('Starting development server…')
  }

  const server = await createServer(getViteConfig('serve', options))

  await server.listen()

  if (!process.env.VITEST)
    consola.success(`Server is listening on :${server.config.server.port}`)

  return server
}

function assertEntryExists(options: BaseOptions): void {
  if (!fs.existsSync(resolve(options.cwd, options.entry)))
    throw new PrettyError(`Cannot find "${options.entry}"`)
}
