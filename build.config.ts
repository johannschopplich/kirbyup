import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/node/index',
    'src/node/cli',
    'src/client/config',
    ...!process.env.STUB ? ['src/client/plugin'] : [],
  ],
  clean: !process.env.STUB,
  stub: !!process.env.STUB,
  declaration: true,
  externals: ['rollup'],
  failOnWarn: false,
  replace: {
    'process.env.VITEST': 'undefined',
  },
})
