// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    vue: {
      // https://github.com/antfu/eslint-config/issues/367
      sfcBlocks: {
        blocks: {
          styles: false,
        },
      },
      vueVersion: 2,
    },
    ignores: ['examples/**/*.vue'],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
)
