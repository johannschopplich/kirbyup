import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/node/index',
    'src/node/cli',
    'src/client/config',
    'src/client/plugin',
  ],
  clean: true,
  declaration: true,
  externals: ['rollup'],
  failOnWarn: false,
  replace: {
    'process.env.VITEST': 'undefined',
  },
})
