import type { InlineConfig, Logger, LogLevel, Rolldown, ViteDevServer } from 'vite'
import type { KirbyupHmrApi } from './plugins/index.ts'
import type { BaseOptions, BuildOptions, ServeOptions, UserConfig } from './types.ts'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import vuePlugin from '@vitejs/plugin-vue'
import vueJsxPlugin from '@vitejs/plugin-vue-jsx'
import { debounce } from 'perfect-debounce'
import { CliError, reportFailure } from 'utilful/cli'
import { build as _build, createLogger, createServer, mergeConfig } from 'vite'
import { loadConfig } from './config.ts'
import * as output from './output.ts'
import {
  kirbyupBuildCleanupPlugin,
  kirbyupFullReloadPlugin,
  kirbyupGlobImportPlugin,
  kirbyupHmrPlugin,
} from './plugins/index.ts'
import { toArray } from './utils.ts'
import { resolveOriginFromServerOptions } from './utils/server.ts'

const DEV_OUTPUT_FILENAME = 'index.dev.js'
const SUPPRESSED_WARNING = '(!) build.outDir'

const logLevel: LogLevel = 'warn'

interface ConfigContext {
  kirbyupConfig: UserConfig
  logger: Logger
}

function getViteConfig(command: 'build', options: BuildOptions, context: ConfigContext): InlineConfig
function getViteConfig(command: 'serve', options: ServeOptions, context: ConfigContext): InlineConfig
function getViteConfig(
  command: string,
  options: BuildOptions | ServeOptions,
  { kirbyupConfig, logger }: ConfigContext,
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
      vuePlugin(),
      vueJsxPlugin(),
      kirbyupGlobImportPlugin(),
    ],
    build: {
      copyPublicDir: false,
    },
    envDir: options.cwd,
    envPrefix: ['VITE_', 'KIRBYUP_'],
    customLogger: logger,
    logLevel,
  }

  if (command === 'serve') {
    const { port, watch } = options as ServeOptions
    const resolvedPort = userConfig.server?.port ?? port
    const inferredOrigin = userConfig.server?.origin ?? resolveOriginFromServerOptions(userConfig.server, resolvedPort, 'localhost')

    const serveConfig: InlineConfig = mergeConfig(sharedConfig, {
      plugins: [
        kirbyupHmrPlugin(options as ServeOptions),
        watch && kirbyupFullReloadPlugin(watch),
      ].filter(Boolean),
      // Input needs to be specified so dependency pre-bundling works.
      build: {
        rollupOptions: {
          input: resolve(options.cwd, options.entry),
        },
      },
      server: {
        port: resolvedPort,
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
        formats: ['iife'],
        // Required by Vite for the IIFE format, but never emitted: `exports:
        // 'none'` leaves the wrapper unassigned.
        name: 'kirbyupPlugin',
        fileName: () => options.watch ? DEV_OUTPUT_FILENAME : 'index.js',
      },
      minify: mode === 'production',
      outDir: options.outDir,
      emptyOutDir: false,
      rollupOptions: {
        external: ['vue'],
        output: {
          assetFileNames: 'index.[ext]',
          // Kirby loads plugins for their side effects only, so an export would
          // be unreadable anyway. Refusing them keeps the IIFE unassigned.
          exports: 'none',
          // Kirby 6 has no Vue global; `vue` resolves through the Panel's import
          // map. The IIFE therefore takes the module namespace as its argument.
          globals: (id: string) => `await import(${JSON.stringify(id)})`,
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
    // Vite and Rolldown report a broken entry as a plain `Error`, which the
    // boundary would take for a defect and print with its stack.
    const buildError = new CliError(error instanceof Error ? error.message : String(error), { cause: error })
    if (!options.watch)
      throw buildError
    reportFailure(buildError)
  }

  if (!result || options.watch)
    return

  const outputs = toArray(result as Rolldown.RolldownOutput | Rolldown.RolldownOutput[])
  const { output: bundle } = outputs[0]!
  const maxLength = Math.max(0, ...bundle.map(item => item.fileName.length))

  for (const item of bundle) {
    const content = item.type === 'chunk'
      ? item.code
      : await fsp.readFile(resolve(options.outDir, item.fileName), 'utf8')

    output.fileWritten({
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
  const context: ConfigContext = {
    kirbyupConfig: config ?? {},
    logger: createKirbyupLogger(),
  }

  const startedAt = performance.now()

  output.banner('building', options.entry)
  output.blankLine()

  await generate(options, context)

  output.aside(`built in ${output.elapsed(startedAt)}`)

  if (!options.watch)
    return

  const { watch } = await import('chokidar')

  const debouncedBuild = debounce(() => {
    generate(options, context).catch(reportFailure)
  }, 100)

  const ignored = [
    '**/{.git,node_modules}/**',
    'index.{css,js}',
    DEV_OUTPUT_FILENAME,
  ]

  const watchPaths = options.watch === true
    ? dirname(options.entry)
    : toArray(options.watch)

  output.watching(toArray(watchPaths))

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

  // An `exit` handler cannot await, so `cleanup` is repeated synchronously here.
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
      output.configChanged(basename(file))
    }
    else {
      output.fileChanged(type, file)
    }

    debouncedBuild()
  })
}

export async function serve(options: ServeOptions): Promise<ViteDevServer> {
  assertEntryExists(options)

  const { cwd } = options

  const { config } = await loadConfig(cwd)
  const context: ConfigContext = {
    kirbyupConfig: config ?? {},
    logger: createKirbyupLogger(),
  }

  const startedAt = performance.now()

  output.banner('starting the development server')
  output.blankLine()

  const server = await createServer(getViteConfig('serve', options, context))

  await server.listen()

  // `server.listen()` resolves as soon as the port is bound, which is before
  // the HMR plugin has written `index.dev.js`. Kirby reads that file to decide
  // whether a plugin is in development, so callers must not race it.
  const hmrApi = server.config.plugins.find(
    plugin => plugin.name === 'kirbyup:hmr',
  )?.api as KirbyupHmrApi | undefined
  await hmrApi?.devIndexWritten

  const port = server.config.server.port ?? options.port
  output.serverReady({
    root: cwd,
    url: server.config.server.origin
      ?? resolveOriginFromServerOptions(server.config.server, port, 'localhost'),
    outDir: options.outDir,
    devFilename: DEV_OUTPUT_FILENAME,
    watchPaths: options.watch === false ? [] : toArray(options.watch),
    startedAt,
  })

  return server
}

function createKirbyupLogger(): Logger {
  const baseLogger = createLogger(logLevel)
  return {
    ...baseLogger,
    warn(msg, options) {
      if (msg.includes(SUPPRESSED_WARNING))
        return
      baseLogger.warn(msg, options)
    },
  }
}

function assertEntryExists(options: BaseOptions): void {
  if (!fs.existsSync(resolve(options.cwd, options.entry)))
    throw new CliError(`Cannot find "${options.entry}"`)
}
