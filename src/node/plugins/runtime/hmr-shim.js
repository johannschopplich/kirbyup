/* eslint-disable no-undef */
import 'vue'

if (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {
  const originalReload = __VUE_HMR_RUNTIME__.reload

  __VUE_HMR_RUNTIME__.reload = function (id, newComp) {
    const { plugins, app } = window.panel ?? {}

    if (plugins?.components) {
      for (const [name, pluginComp] of Object.entries(plugins.components)) {
        if (
          pluginComp.__hmrId === id
          || (newComp.__file && pluginComp.__file === newComp.__file)
        ) {
          plugins.resolveComponentExtension(app, name, newComp)
          plugins.resolveComponentRender(newComp)
          plugins.resolveComponentMixins(newComp)
          break
        }
      }
    }

    return originalReload(id, newComp)
  }
}
else {
  console.warn(
    '[kirbyup] Vue HMR runtime not detected; component changes will fall back to full page reload. The Kirby Panel may be loading a production build of Vue.',
  )
}
