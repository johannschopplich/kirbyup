import { cac } from 'cac'
import { build } from './index'
import { name, version } from '../../package.json'
import { handleError } from './errors'
import type { CliOptions } from './types'

async function main(options: CliOptions = {}) {
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
