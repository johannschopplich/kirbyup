import type { CommandDef } from 'utilful/cli'
import type { BuildArgs } from './commands/build.ts'
import { defineCommand } from 'utilful/cli'
import packageJson from '../../package.json' with { type: 'json' }
import { buildArgs, buildCommand } from './commands/build.ts'
import { devCommand, serveCommand } from './commands/dev.ts'

export const mainCommand: CommandDef<BuildArgs> = defineCommand({
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    description: `${packageJson.description}. An entry file on its own builds it: kirbyup src/index.js`,
  },
  args: buildArgs,
  subCommands: {
    build: buildCommand,
    dev: devCommand,
    serve: serveCommand,
  },
  run: buildCommand.run,
})
