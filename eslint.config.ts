import type { ConfigNames, TypedFlatConfigItem } from '@antfu/eslint-config'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'
import antfu from '@antfu/eslint-config'

const config: FlatConfigComposer<TypedFlatConfigItem, ConfigNames> = antfu({
  vue: {
    // https://github.com/antfu/eslint-config/issues/367
    sfcBlocks: {
      blocks: {
        styles: false,
      },
    },
    vueVersion: 2,
  },
  ignores: ['examples/**/*'],
}).append({
  rules: {
    'node/prefer-global/process': 'off',
  },
})

export default config
