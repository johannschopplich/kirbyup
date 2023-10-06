import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: ['examples/**', 'tsconfig.json'],
  },
  {
    rules: {
      'node/prefer-global/process': 'off',
    },
  },
)
