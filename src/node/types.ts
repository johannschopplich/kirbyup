import type { AliasOptions, InlineConfig } from 'vite'
import type * as Postcss from 'postcss'
import type liveReloadPlugin from 'vite-plugin-live-reload'

export type MarkRequired<T, RK extends keyof T> = Exclude<T, RK> &
Required<Pick<T, RK>>

export interface CliOptions {
  cwd?: string
  entry?: string
  outDir?: string
  watch?: boolean | string | Array<boolean | string>
}

export type ResolvedCliOptions = MarkRequired<CliOptions, 'cwd' | 'entry' >

export interface UserConfig {
  /**
   * Load from config files
   * Set to `false` to disable
   */
  configFile?: string | false

  /**
   * Specifies an `Object`, or an `Array` of `Object`,
   * which defines aliases used to replace values in `import` statements.
   * With either format, the order of the entries is important,
   * in that the first defined rules are applied first.
   */
  alias?: AliasOptions

  /**
   * Controls whether the plugin's PHP files are watched for changes.
   * Pass true or false to enable or disable. Alternatively you can pass
   * an array of arguments that are passed to vite-plugin-live-reload.
   * The default is to watch all PHP files in the plugin directory. (./\*\*\/*.php)
   */
  reloadOnPhpChange: boolean | Parameters<typeof liveReloadPlugin>

  /**
   * Extends Vite's configuration. Will be merged with kirbyup's
   * default configuration. Be careful what to extend.
   */
  extendViteConfig?: InlineConfig
}

export interface PostCSSConfigResult {
  options?: Postcss.ProcessOptions
  plugins: Postcss.Plugin[]
}
