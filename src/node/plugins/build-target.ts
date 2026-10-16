import type { Plugin } from 'vite'

// The Kirby 6 Panel's browsers, from its `panel/.browserslistrc`. Vite's older
// default would compile `light-dark()` into variables the Panel never defines.
const PANEL_BUILD_TARGET = ['chrome124', 'edge124', 'firefox125', 'opera110', 'safari17.5', 'ios17.5']

export function kirbyupBuildTargetPlugin(): Plugin {
  return {
    name: 'kirbyup:build-target',
    enforce: 'post',

    configEnvironment(_name, options) {
      if (options.build?.target === undefined)
        return { build: { target: PANEL_BUILD_TARGET } }
    },
  }
}
