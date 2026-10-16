import type { CommandDef, ParsedArgs } from 'utilful/cli'
import process from 'node:process'
import { CliError, defineCommand, log } from 'utilful/cli'
import { serve } from '../index.ts'
import { resolveWatchPaths } from './watch-paths.ts'

export const devArgs = {
  'file': { type: 'positional', description: 'Entry file of the plugin', required: true },
  'out-dir': { type: 'string', alias: 'd', description: 'Output directory', valueHint: 'dir' },
  'watch': { type: 'boolean', alias: 'w', default: true, description: 'Reload the Panel when a watched file changes' },
  'watch-path': { type: 'string', default: './**/*.php', description: 'Comma-separated files, folders and globs to watch', valueHint: 'paths' },
  'port': { type: 'string', alias: 'p', default: '5177', description: 'Port for the development server' },
} as const

async function run({ args }: { args: ParsedArgs<typeof devArgs> }): Promise<void> {
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

export const devCommand: CommandDef<typeof devArgs> = defineCommand({
  meta: {
    name: 'dev',
    description: 'Start a development server with live reload',
  },
  args: devArgs,
  run,
})

export const serveCommand: CommandDef<typeof devArgs> = defineCommand({
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

/** The parser has no number type, so the port arrives as a string. */
function parsePort(value: string): number {
  const port = Number(value)

  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new CliError(`Not a usable port: ${JSON.stringify(value)}`)

  return port
}
