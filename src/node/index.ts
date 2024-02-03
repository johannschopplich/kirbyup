import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'pathe'
import { consola } from 'consola'
import { colors } from 'consola/utils'
import { debounce } from 'perfect-debounce'
import { build as _build, createServer, mergeConfig } from 'vite'
import * as vueCompilerSfc from 'vue/compiler-sfc'
import vuePlugin from '@vitejs/plugin-vue2'
import vueJsxPlugin from '@vitejs/plugin-vue2-jsx'
import fullReloadPlugin from 'vite-plugin-full-reload'
import externalGlobals from 'rollup-plugin-external-globals'
import type { OutputChunk, RollupOutput } from 'rollup'
import type { InlineConfig } from 'vite'
import { name, version } from '../../package.json'
import { PrettyError, handleError } from './errors'
import { printFileInfo, toArray } from './utils'
import { loadConfig, resolvePostCSSConfig } from './config'
import kirbyupGlobImportPlugin from './plugins/glob-import'
import kirbyupHmrPlugin from './plugins/hmr'
import kirbyupBuildCleanupPlugin from './plugins/build-cleanup'
import type { BaseOptions, BuildOptions, PostCSSConfigResult, ServeOptions, UserConfig } from './types'

let resolvedKirbyupConfig: UserConfig
let resolvedPostCssConfig: PostCSSConfigResult

function getViteConfig<T extends 'build' | 'serve'>(
  command: T,
  options: T extends 'build' ? BuildOptions : ServeOptions,
): InlineConfig {
  const aliasDir = resolve(options.cwd, dirname(options.entry))
  const { alias = {}, vite, extendViteConfig } = resolvedKirbyupConfig
  const userConfig = vite ?? extendViteConfig ?? {}

  const baseConfig: InlineConfig = {
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
    css: { postcss: resolvedPostCssConfig },
    envPrefix: ['VITE_', 'KIRBYUP_'],
    logLevel: 'warn',
  }

  if (command === 'serve') {
    const { port, watch } = options as ServeOptions

    const serveConfig: InlineConfig = mergeConfig(baseConfig, {
      plugins: [
        kirbyupHmrPlugin(options as ServeOptions),
        watch && fullReloadPlugin(watch),
      ].filter(Boolean),
      // Input needs to be specified so dependency pre-bundling works
      build: { rollupOptions: { input: resolve(options.cwd, options.entry) } },
      // Specify origin so asset URLs include Vite server host
      server: { port, strictPort: true, origin: `http://localhost:${port}` },
    })

    return mergeConfig(serveConfig, userConfig)
  }

  const mode = options.watch ? 'development' : 'production'

  const buildConfig: InlineConfig = mergeConfig(baseConfig, {
    plugins: [kirbyupBuildCleanupPlugin(options as BuildOptions)],
    mode,
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
    const { output } = toArray(result as RollupOutput)[0]

    let longest = 0
    for (const file in output) {
      const l = output[file].fileName.length
      if (l > longest)
        longest = l
    }

    for (const { fileName, type, code } of (output as OutputChunk[])) {
      await printFileInfo(
        options.cwd,
        options.outDir,
        fileName,
        code ?? (await readFile(resolve(options.outDir, fileName), 'utf8')),
        type,
        longest,
      )
    }
  }

  return result
}

export async function build(options: BuildOptions) {
  ensureEntry(options)

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
  ensureEntry(options)

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

function ensureEntry(options: BaseOptions) {
  // Ensure entry exists
  if (!existsSync(resolve(options.cwd, options.entry)))
    throw new PrettyError(`Cannot find "${options.entry}"`)
}
