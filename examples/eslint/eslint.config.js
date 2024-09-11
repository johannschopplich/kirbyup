import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: ['**/vendor/**', 'index.js'],
  },
  ignores: ['**/vendor/**', 'index.js'],
}, {
  files: ['**/*.vue'],
  rules: {
    'vue/html-self-closing': 'off',
  },
})
