import { Options } from 'tsup'

const config: Options = {
  splitting: true,
  format: ['cjs'],
  entryPoints: ['src/node/cli.ts', 'src/node/index.ts'],
  target: 'node14',
  clean: true,
  dts: true
}

export default config
