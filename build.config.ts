import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: ['src/node/index', 'src/node/cli', 'src/client/plugin'],
  clean: true,
  declaration: true,
  externals: ['postcss', 'magic-string', 'rollup']
})
