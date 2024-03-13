import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    vue: {
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
