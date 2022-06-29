import { cac } from 'cac'
import { name, version } from '../../package.json'
import type { CliOptions } from './types'
import { build } from './index'

export async function startCli(
  cwd = process.cwd(),
  argv = process.argv,
  options: CliOptions = {},
) {
  const cli = cac(name)

  cli
    .command('[file]', 'Panel input file', {
      ignoreOptionDefaultValue: true,
    })
    .option('-d, --out-dir <dir>', 'Output directory', {
      default: cwd,
    })
    .option(
      '-w, --watch [path]',
      'Watch for file changes. If no path is specified, the folder of the input file will be watched. Repeat "--watch" for multiple paths.',
    )
    .action(async (file: string, flags) => {
      Object.assign(options, {
        cwd,
        ...flags,
      })

      if (file)
        options.entry = file

      await build(options)
    })

  cli.help()
  cli.version(version)

  // Parse CLI args without running the command to
  // handle command errors globally
  cli.parse(argv, { run: false })
  await cli.runMatchedCommand()
}

