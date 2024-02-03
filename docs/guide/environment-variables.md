# Environment Variables

kirbyup exposes environment variables on the special `import.meta.env` object. Some built-in variables are available in all cases:

- **`import.meta.env.MODE`** (`development` | `production`): the mode kirbyup is running in.
- **`import.meta.env.PROD`** (`boolean`): whether kirbyup is running in production.
- **`import.meta.env.DEV`** (`boolean`): whether kirbyup is running in development (always the opposite of `import.meta.env.PROD`)

During production, these env variables are **statically replaced**. It is therefore necessary to always reference them using the full static string. For example, dynamic key access like `import.meta.env[key]` will not work.

## `.env` Files

kirbyup (thanks to Vite) uses [dotenv](https://github.com/motdotla/dotenv) to load additional environment variables from the `.env` and `.env.local` files in your plugin's root directory.

Loaded env variables are also exposed to your source code via `import.meta.env`.

To prevent accidentally leaking env variables for distribution, only variables prefixed with `KIRBYUP_` or `VITE_` are exposed to your processed code. Take the following file as an example:

```ini
DB_PASSWORD=foobar
KIRBYUP_SOME_KEY=123
```

Only `KIRBYUP_SOME_KEY` will be exposed as `import.meta.env.VITE_SOME_KEY` to your plugin's source code, but `DB_PASSWORD` will not.
