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
    .option(
      '--watch [path]',
      'Watch mode, if path is not specified, it watches the folder of the input file. Repeat "--watch" for more than one path'
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

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}

main().catch(handleError)
