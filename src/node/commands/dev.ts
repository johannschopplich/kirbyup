import type { ArgsDef, CommandDef, ParsedArgs } from 'utilful/cli'
import process from 'node:process'
import { CliError, commonArgs, defineCommand, log } from 'utilful/cli'
import { serve } from '../index.ts'
import { resolveWatchPaths } from './watch-paths.ts'

const DEFAULT_PORT = 5177
const DEFAULT_WATCH = './**/*.php'

export interface DevArgs extends ArgsDef {
  'file': { type: 'positional', description: string, required: true }
  'out-dir': { type: 'string', alias: string, description: string }
  'watch': { type: 'boolean', alias: string, default: boolean, description: string }
  'watch-path': { type: 'string', default: string, description: string }
  'port': { type: 'string', alias: string, default: string, description: string }
}

export const devArgs: DevArgs = {
  ...commonArgs,
  'file': { type: 'positional', description: 'Entry file of the plugin', required: true },
  'out-dir': { type: 'string', alias: 'd', description: 'Output directory' },
  'watch': { type: 'boolean', alias: 'w', default: true, description: 'Reload the Panel when a watched file changes' },
  'watch-path': { type: 'string', default: DEFAULT_WATCH, description: 'Comma-separated files, folders and globs to watch' },
  'port': { type: 'string', alias: 'p', default: String(DEFAULT_PORT), description: 'Port for the development server' },
}

async function run({ args }: { args: ParsedArgs<DevArgs> }): Promise<void> {
  process.env.NODE_ENV ||= 'development'

  const paths = resolveWatchPaths(args['watch-path'], { allowGlobs: true })

  const server = await serve({
    cwd: process.cwd(),
    entry: args.file,
    outDir: args['out-dir'] ?? process.cwd(),
    watch: args.watch && paths.length > 0 ? paths : false,
    port: parsePort(args.port),
  })

  // Vite handles SIGTERM and the end of stdin itself, but not SIGINT.
  process.once('SIGINT', async () => {
    try {
      await server.close()
    }
    finally {
      process.exit()
    }
  })
}

export const devCommand: CommandDef<DevArgs> = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start a development server with live reload',
  },
  args: devArgs,
  run,
})

export const serveCommand: CommandDef<DevArgs> = defineCommand({
  meta: {
    name: 'serve',
    description: 'Former name of dev, kept so existing scripts keep working',
  },
  args: devArgs,
  async run(context) {
    log.info('`kirbyup serve` is now `kirbyup dev`.')
    await run(context)
  },
})

/** The parser knows strings and booleans only, so the port arrives as a string. */
function parsePort(value: string): number {
  const port = Number(value)

  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new CliError(`Not a usable port: ${JSON.stringify(value)}`)

  return port
}
