declare module 'postcss-logical'
declare module 'postcss-dir-pseudo-class'

// Infers declarations from Vite. Only applicable for the kirbyup
// `plugin` module (ESM), not the CLI itself (CJS)
interface ImportMeta {
  url: string

  readonly env: ImportMetaEnv

  glob(pattern: string): Record<
    string,
    () => Promise<{
      [key: string]: any
    }>
  >

  globEager(pattern: string): Record<
    string,
    {
      [key: string]: any
    }
  >
}

interface ImportMetaEnv {
  [key: string]: string | boolean | undefined
  BASE_URL: string
  MODE: string
  DEV: boolean
  PROD: boolean
  SSR: boolean
}
