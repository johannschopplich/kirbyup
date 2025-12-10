// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu({
  pnpm: false,
  ignores: ['examples/**/*.vue'],
}).append({
  rules: {
    'node/prefer-global/process': 'off',
  },
})
