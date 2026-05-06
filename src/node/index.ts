import type { InlineConfig, Logger, LogLevel, Rolldown, ViteDevServer } from 'vite'
import type { PostCSSConfigResult } from './config'
import type { BaseOptions, BuildOptions, ServeOptions, UserConfig } from './types'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import vuePlugin from '@vitejs/plugin-vue'
import vueJsxPlugin from '@vitejs/plugin-vue-jsx'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import { basename, dirname, resolve } from 'pathe'
import { debounce } from 'perfect-debounce'
import { build as _build, createLogger, createServer, mergeConfig } from 'vite'
import * as vueCompilerSfc from 'vue/compiler-sfc'
import { name, version } from '../../package.json'
import { loadConfig, resolvePostCSSConfig } from './config'
import { handleError, PrettyError } from './errors'
import {
  kirbyupBuildCleanupPlugin,
  kirbyupFullReloadPlugin,
  kirbyupGlobImportPlugin,
  kirbyupHmrPlugin,
} from './plugins'
import { printFileInfo, toArray } from './utils'
import { resolveOriginFromServerOptions } from './utils/server'

const DEV_OUTPUT_FILENAME = 'index.dev.js'
const SUPPRESSED_WARNING_PREFIX = '\n(!) build.outDir'

const logLevel: LogLevel = 'warn'

interface ConfigContext {
  kirbyupConfig: UserConfig
  postCssConfig: PostCSSConfigResult | undefined
  logger: Logger
}

function getViteConfig(command: 'build', options: BuildOptions, context: ConfigContext): InlineConfig
function getViteConfig(command: 'serve', options: ServeOptions, context: ConfigContext): InlineConfig
function getViteConfig(
  command: string,
  options: BuildOptions | ServeOptions,
  { kirbyupConfig, postCssConfig, logger }: ConfigContext,
): InlineConfig {
  const aliasDir = resolve(options.cwd, dirname(options.entry))
  const { alias = {}, vite } = kirbyupConfig
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
      // Inject the SFC compiler explicitly – `plugin-vue` resolves it
      // relative to cwd by default, which breaks npx kirbyup
      vuePlugin({ compiler: vueCompilerSfc }),
      vueJsxPlugin(),
      kirbyupGlobImportPlugin(),
    ],
    build: {
      copyPublicDir: false,
    },
    ...(postCssConfig && {
      css: {
        postcss: {
          ...postCssConfig.options,
          plugins: postCssConfig.plugins,
        },
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
        watch && kirbyupFullReloadPlugin(watch),
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

async function generate(options: BuildOptions, context: ConfigContext): Promise<void> {
  const config = getViteConfig('build', options, context)

  let result: Awaited<ReturnType<typeof _build>> | undefined

  try {
    result = await _build(config)
  }
  catch (error) {
    if (!options.watch)
      throw error
    consola.error(error)
  }

  if (!result || options.watch)
    return

  const outputs = toArray(result as Rolldown.RolldownOutput | Rolldown.RolldownOutput[])
  const { output } = outputs[0]!
  const maxLength = Math.max(0, ...output.map(item => item.fileName.length))

  for (const item of output) {
    const content = item.type === 'chunk'
      ? item.code
      : await fsp.readFile(resolve(options.outDir, item.fileName), 'utf8')

    await printFileInfo({
      root: options.cwd,
      outDir: options.outDir,
      filePath: item.fileName,
      content,
      type: item.type,
      maxLength,
    })
  }
}

export async function build(options: BuildOptions): Promise<void> {
  assertEntryExists(options)

  const { cwd } = options

  const { config, configFile } = await loadConfig(cwd)
  const postCssConfig = await resolvePostCSSConfig(cwd)
  const context: ConfigContext = {
    kirbyupConfig: config ?? {},
    postCssConfig,
    logger: createKirbyupLogger(),
  }

  if (!process.env.VITEST) {
    consola.log(colors.green(`${name} v${version}`))
    consola.start(`Building ${colors.cyan(options.entry)}`)
  }

  await generate(options, context)

  if (!process.env.VITEST)
    consola.success('Build successful')

  if (!options.watch)
    return

  const { watch } = await import('chokidar')

  const debouncedBuild = debounce(() => {
    generate(options, context).catch(handleError)
  }, 100)

  const ignored = [
    '**/{.git,node_modules}/**',
    'index.{css,js}',
    DEV_OUTPUT_FILENAME,
  ]

  const watchPaths = options.watch === true
    ? dirname(options.entry)
    : toArray(options.watch)

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

  const onShutdown = () => {
    cleanup().finally(() => process.exit(0))
  }
  process.once('SIGINT', onShutdown)
  process.once('SIGTERM', onShutdown)

  if (configFile)
    watcher.add(configFile)

  watcher.on('all', async (type, file) => {
    const absolutePath = resolve(cwd, file)

    if (configFile === absolutePath) {
      context.kirbyupConfig = (await loadConfig(cwd)).config ?? {}
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
  const postCssConfig = await resolvePostCSSConfig(cwd)
  const context: ConfigContext = {
    kirbyupConfig: config ?? {},
    postCssConfig,
    logger: createKirbyupLogger(),
  }

  if (!process.env.VITEST) {
    consola.log(colors.green(`${name} v${version}`))
    consola.info('Starting development server…')
  }

  const server = await createServer(getViteConfig('serve', options, context))

  await server.listen()

  if (!process.env.VITEST)
    consola.success(`Server is listening on :${server.config.server.port}`)

  return server
}

function createKirbyupLogger(): Logger {
  const baseLogger = createLogger(logLevel)
  return {
    ...baseLogger,
    warn(msg, options) {
      if (msg.startsWith(SUPPRESSED_WARNING_PREFIX))
        return
      baseLogger.warn(msg, options)
    },
  }
}

function assertEntryExists(options: BaseOptions): void {
  if (!fs.existsSync(resolve(options.cwd, options.entry)))
    throw new PrettyError(`Cannot find "${options.entry}"`)
}
