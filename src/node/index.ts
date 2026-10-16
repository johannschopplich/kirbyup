import type { InlineConfig, Logger, LogLevel, Rolldown, ViteDevServer } from 'vite'
import type { KirbyupHmrApi } from './plugins/index.ts'
import type { BaseOptions, BuildOptions, ServeOptions, UserConfig } from './types.ts'
import * as fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { basename, dirname, relative, resolve } from 'node:path'
import vuePlugin from '@vitejs/plugin-vue'
import vueJsxPlugin from '@vitejs/plugin-vue-jsx'
import { debounce } from 'perfect-debounce'
import { CliError, reportFailure } from 'utilful/cli'
import { build as _build, createLogger, createServer, mergeConfig } from 'vite'
import { loadConfig } from './config.ts'
import * as output from './output.ts'
import {
  kirbyupBuildCleanupPlugin,
  kirbyupBuildTargetPlugin,
  kirbyupFullReloadPlugin,
  kirbyupGlobImportPlugin,
  kirbyupHmrPlugin,
} from './plugins/index.ts'
import { toArray } from './utils.ts'
import { resolveOriginFromServerOptions } from './utils/server.ts'

const DEV_OUTPUT_FILENAME = 'index.dev.js'
const DEV_STYLESHEET_FILENAME = 'index.dev.css'
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
        rolldownOptions: {
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
    plugins: [kirbyupBuildCleanupPlugin(options as BuildOptions), kirbyupBuildTargetPlugin()],
    build: {
      lib: {
        entry: resolve(options.cwd, options.entry),
        formats: ['es'],
        fileName: () => options.watch ? DEV_OUTPUT_FILENAME : 'index.js',
        // Kirby pairs `index.dev.css` with `index.dev.js`, so a watch build
        // leaves the shipped `index.css` alone. Naming the stylesheet also
        // keeps Vite from requiring a `package.json` name.
        cssFileName: options.watch ? 'index.dev' : 'index',
      },
      minify: mode === 'production',
      outDir: options.outDir,
      emptyOutDir: false,
      rolldownOptions: {
        // The Panel's import map resolves `vue`, so every plugin shares the
        // Panel's Vue instance.
        external: ['vue'],
        output: {
          assetFileNames: '[name][extname]',
          // Kirby serves a plugin's `index.js` or `index.dev.js` and no other script,
          // so a chunk would 404.
          codeSplitting: false,
        },
      },
    },
  })

  const config = mergeConfig(buildConfig, userConfig)
  const rolldownOutput = config.build?.rolldownOptions?.output

  // Vite's library mode skips whitespace removal for ES output. Restored only
  // for Vite's own minifier, and only when the config sets no `output.minify`.
  if (
    (config.build?.minify === true || config.build?.minify === 'oxc')
    && rolldownOutput && !Array.isArray(rolldownOutput) && rolldownOutput.minify === undefined
  ) {
    rolldownOutput.minify = true
  }

  return config
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

  const devOutputPaths = [DEV_OUTPUT_FILENAME, DEV_STYLESHEET_FILENAME]
    .map(filename => resolve(options.outDir, filename))

  const watchPaths = options.watch === true
    ? dirname(options.entry)
    : toArray(options.watch)

  output.watching(toArray(watchPaths))

  const watcher = watch(watchPaths, {
    ignoreInitial: true,
    ignorePermissionErrors: true,
    // chokidar matches a string only as an exact path, never as a glob.
    ignored: [
      ...devOutputPaths,
      // Relative to `cwd`, so a plugin below a `node_modules` folder still rebuilds.
      (filePath: string) => /(?:^|[/\\])(?:\.git|node_modules)(?:[/\\]|$)/.test(relative(cwd, filePath)),
    ],
    cwd,
  })

  const cleanup = async () => {
    await watcher.close().catch(() => {})
    await Promise.all(devOutputPaths.map(path => fsp.rm(path, { force: true }).catch(() => {})))
  }

  // An `exit` handler cannot await, so `cleanup` is repeated synchronously here.
  process.once('exit', () => {
    for (const path of devOutputPaths) {
      try {
        fs.rmSync(path, { force: true })
      }
      catch {}
    }
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
