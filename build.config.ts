import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/node/index',
    'src/node/cli',
    'src/client/config',
    ...(!process.env.UNBUILD_STUB ? ['src/client/plugin'] : []),
  ],
  clean: !process.env.UNBUILD_STUB,
  stub: !!process.env.UNBUILD_STUB,
  declaration: true,
  externals: ['rollup'],
  replace: {
    'process.env.VITEST': 'undefined',
  },
  failOnWarn: false,
})
