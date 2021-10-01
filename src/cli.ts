#!/usr/bin/env node

import { cac } from 'cac'
import { name, version } from '../package.json'
import { handleError } from './errors'
import type { Options } from './types'

async function main(options: Options = {}) {
  const cli = cac(name)

  cli
    .command('[file]', 'Panel input file', {
      ignoreOptionDefaultValue: true
    })
    .option('-d, --out-dir <dir>', 'Output directory', {
      default: process.cwd()
    })
    .option(
      '--watch [path]',
      'Watch mode, if path is not specified, it watches the folder of the input file. Repeat "--watch" for multiple paths'
    )
    .action(async (file: string, flags) => {
      const { build } = await import('.')

      Object.assign(options, {
        ...flags
      })

      if (file) {
        options.entry = file
      }

      await build(options)
    })

  cli.help()

  cli.version(version)

  // Parse CLI args without running the command to
  // handle command errors globally
  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}

main().catch(handleError)
