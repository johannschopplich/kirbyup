import type { ArgsDef, CommandDef } from 'citty'
import { defineCommand } from 'citty'
import packageJson from '../../package.json' with { type: 'json' }
import { buildArgs, buildCommand } from './commands/build.ts'
import { devArgs, devCommand, serveCommand } from './commands/dev.ts'
import { optionName, splitShortOptionValues, withCleanErrors } from './errors.ts'

export const COMMAND_NAMES: ReadonlySet<string> = new Set(['build', 'dev', 'serve'])

/**
 * Every option any command declares, so `findOperandIndex` can tell an option
 * that swallows the next token from one that does not, while the command is
 * still unknown.
 */
const EVERY_ARG: ArgsDef = { ...buildArgs, ...devArgs }

export const mainCommand: CommandDef = defineCommand({
  meta: {
    name: packageJson.name,
    version: packageJson.version,
    description: `${packageJson.description}. An entry file on its own builds it: kirbyup src/index.js`,
  },
  subCommands: {
    build: withCleanErrors(buildCommand),
    dev: withCleanErrors(devCommand),
    serve: withCleanErrors(serveCommand),
  },
})

/**
 * citty reads the first operand as a sub-command name and discards
 * everything ahead of it, so the name moves to the front rather than the options
 * moving behind it. An operand that names no command is an entry file for
 * `build`, the form every Kirby plugin already uses; citty's `default` option is
 * no help there, since it only applies when no operand is given at all.
 */
export function normalizeArgs(argv: readonly string[]): string[] {
  const split = splitShortOptionValues(argv)
  const operandIndex = findOperandIndex(split)

  if (operandIndex === -1)
    return split

  const terminatorIndex = split.indexOf('--')
  const operand = split[operandIndex]!
  // Past `--` a token is an operand by definition, so it never names a command.
  const isCommandName = COMMAND_NAMES.has(operand)
    && (terminatorIndex === -1 || operandIndex < terminatorIndex)

  return isCommandName
    ? [operand, ...split.slice(0, operandIndex), ...split.slice(operandIndex + 1)]
    : ['build', ...split]
}

function findOperandIndex(argv: readonly string[]): number {
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index]!

    if (argument === '--')
      return index + 1 < argv.length ? index + 1 : -1

    if (!argument.startsWith('-'))
      return index

    if (!argument.includes('=') && EVERY_ARG[optionName(argument.replace(/^--?/, ''))]?.type === 'string')
      index++
  }

  return -1
}
