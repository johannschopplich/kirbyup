import antfu from '@antfu/eslint-config'
import tailwindcssPlugin from 'eslint-plugin-tailwindcss'

export default antfu(
  {
    vue: {
      vueVersion: 2,
    },
    ignores: ['**/vendor/**', 'index.js'],
  },
  {
    files: ['**/*.vue'],
    plugins: {
      tailwindcss: tailwindcssPlugin,
    },
    rules: {
      'tailwindcss/classnames-order': 'warn',
      'tailwindcss/enforces-negative-arbitrary-values': 'warn',
      'tailwindcss/enforces-shorthand': 'warn',
      'tailwindcss/migration-from-tailwind-2': 'off',
      'tailwindcss/no-arbitrary-value': 'off',
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/no-contradicting-classname': 'error',
    },
  },
)
