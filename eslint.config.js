import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    regexp: false,
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
