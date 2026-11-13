# Env Variables

kirbyup exposes environment variables on `import.meta.env`. Three of them describe the build mode:

- **`import.meta.env.MODE`**: `development` or `production`.
- **`import.meta.env.DEV`**: `true` in development.
- **`import.meta.env.PROD`**: `true` in production, the opposite of `DEV`.

Production builds replace them statically and drop dead branches. Write the full property name: `import.meta.env[key]` drops no dead branch.

```js
// Removed from the production bundle
if (import.meta.env.DEV) {
  console.log(this.$panel.view.title)
}
```

## `.env` Files

Vite loads `.env` and `.env.local` from the project root. Only variables prefixed with `KIRBYUP_` or `VITE_` reach the bundle, every other variable stays out of it.

```ini
# .env
DB_PASSWORD=secret
KIRBYUP_API_BASE=https://example.test/api
```

```js
console.log(import.meta.env.KIRBYUP_API_BASE) // 'https://example.test/api'
console.log(import.meta.env.DB_PASSWORD) // undefined
```

The value is inlined into `index.js`, so treat every prefixed variable as public.
