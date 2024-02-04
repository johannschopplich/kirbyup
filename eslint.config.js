import antfu from '@antfu/eslint-config'

export default await antfu(
  {
    vue: {
      vueVersion: 2,
    },
    ignores: ['examples/**/*.vue', 'docs/**/*.md', 'tsconfig.json'],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
)
