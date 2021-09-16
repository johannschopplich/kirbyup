import { readFileSync } from 'fs'
import { join } from 'path'
import { cac } from 'cac'
import { Options } from '.'

export async function main(options: Options = {}) {
  const cli = cac('kirbyup')

  cli
    .command('[file]', 'Panel input file', {
      ignoreOptionDefaultValue: true
    })
    .option(
      '--watch [path]',
      'Watch mode, if path is not specified, it watches the current folder ".". Repeat "--watch" for more than one path'
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

  const pkgPath = join(__dirname, '../package.json')
  cli.version(JSON.parse(readFileSync(pkgPath, 'utf8')).version)

  cli.parse(process.argv, { run: false })
  await cli.runMatchedCommand()
}
