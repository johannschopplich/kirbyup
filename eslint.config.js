import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    vue: {
      vueVersion: 2,
    },
    ignores: ['examples/**/*.vue', 'tsconfig.json'],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
)
