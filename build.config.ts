import { readFileSync } from 'fs'
import { defineBuildConfig } from 'unbuild'

const { dependencies } = JSON.parse(
  readFileSync('./package.json', { encoding: 'utf8' })
)

export default defineBuildConfig({
  entries: ['src/node/index', 'src/node/cli', 'src/client/plugin'],
  clean: true,
  declaration: true,
  externals: [
    ...Object.keys(dependencies || {}),
    'postcss',
    'magic-string',
    'rollup'
  ]
})
