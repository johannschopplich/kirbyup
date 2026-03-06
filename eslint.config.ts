import type { ConfigNames, TypedFlatConfigItem } from '@antfu/eslint-config'
import type { FlatConfigComposer } from 'eslint-flat-config-utils'
import antfu from '@antfu/eslint-config'

const config: FlatConfigComposer<TypedFlatConfigItem, ConfigNames> = antfu({
  pnpm: false,
  ignores: ['examples/**/*'],
}).append({
  rules: {
    'node/prefer-global/process': 'off',
  },
})

export default config
