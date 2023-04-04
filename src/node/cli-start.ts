import { cac } from 'cac'
import { name, version } from '../../package.json'
import { build, serve } from './index'

export async function startCli(cwd = process.cwd(), argv = process.argv) {
  const cli = cac(name)

  cli
    .command('<file>', 'Compile the Kirby Panel plugin to index.js and index.css')
    .option('-d, --out-dir <dir>', 'Output directory', { default: cwd })
    .option(
      '-w, --watch [path]',
      'Watch for file changes. If no path is specified, the folder of the input file will be watched',
      { default: false },
    )
    .example('kirbyup src/index.js')
    .example('kirbyup src/index.js --out-dir ~/kirby-site/site/plugins/demo')
    .example('kirbyup src/index.js --watch src/**/*.{js,css} --watch assets/*\n')
    .action(async (
      file: string,
      options: {
        outDir: string
        watch: boolean | string | string[]
      },
    ) => {
      await build({ cwd, entry: file, ...options })
    })

  cli
    .command('serve <file>', 'Start development server with live reload')
    .option('--no-watch', 'Don\'t watch .php files for changes', { default: '\0' })
    .option('-w, --watch <path>', 'Watch additional files', { default: './**/*.php' })
    .option('-p, --port <number>', 'Port for the development server', { default: 5177 })
    .option('-d, --out-dir <dir>', 'Output directory')
    .example('kirbyup serve src/index.js')
    .example('kirbyup serve src/index.js --no-watch --port 3003')
    .example('kirbyup serve src/index.js --watch snippets/*.php --watch templates/*.php\n')
    .action(async (
      file: string,
      options: {
        watch: false | string | string[]
        port: number
        outDir?: string
      },
    ) => {
      const server = await serve({ cwd, entry: file, ...options })

      // Vite handles SIGTERM and end of stdin (Ctrl+D) itself, but not SIGINT
      const exitProcess = async () => {
        try {
          await server.close()
        }
        finally {
          process.exit()
        }
      }

      process.once('SIGINT', exitProcess)
    })

  // Filter out unnecessary `default` output for negated options (zerobyte acts as marker)
  cli.help(s =>
    s.map(msg => ({ ...msg, body: msg.body.replace(' (default: \0)', '') })),
  )

  cli.version(version)

  // Parse CLI args without running the command to
  // handle command errors globally
  cli.parse(argv, { run: false })
  await cli.runMatchedCommand()
}
