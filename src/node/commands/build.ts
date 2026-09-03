import type { ArgsDef, CommandDef } from 'utilful/cli'
import process from 'node:process'
import { commonArgs, defineCommand } from 'utilful/cli'
import { build } from '../index.ts'
import { resolveWatchPaths } from './watch-paths.ts'

export interface BuildArgs extends ArgsDef {
  'file': { type: 'positional', description: string, required: true }
  'out-dir': { type: 'string', alias: string, description: string, valueHint: string }
  'watch': { type: 'boolean', alias: string, description: string }
  'watch-path': { type: 'string', description: string, valueHint: string }
}

export const buildArgs: BuildArgs = {
  ...commonArgs,
  'file': { type: 'positional', description: 'Entry file of the plugin', required: true },
  'out-dir': { type: 'string', alias: 'd', description: 'Output directory', valueHint: 'dir' },
  'watch': { type: 'boolean', alias: 'w', description: 'Rebuild when the folder of the entry file changes' },
  'watch-path': { type: 'string', description: 'Comma-separated files and folders to watch instead', valueHint: 'paths' },
}

export const buildCommand: CommandDef<BuildArgs> = defineCommand({
  meta: {
    name: 'build',
    description: 'Compile the Kirby Panel plugin to index.js and index.css',
  },
  args: buildArgs,
  async run({ args }) {
    const cwd = process.cwd()
    // Naming a path is asking to watch it, so `--watch-path` stands on its own.
    const paths = resolveWatchPaths(args['watch-path'], { allowGlobs: false })
    const watch = paths.length > 0 ? paths : args.watch

    process.env.NODE_ENV ||= watch === false ? 'production' : 'development'

    await build({
      cwd,
      entry: args.file,
      outDir: args['out-dir'] ?? cwd,
      watch,
    })
  },
})
