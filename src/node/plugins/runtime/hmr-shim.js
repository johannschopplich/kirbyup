/* eslint-disable no-undef */
import 'vue'

if (typeof __VUE_HMR_RUNTIME__ !== 'undefined') {
  const originalReload = __VUE_HMR_RUNTIME__.reload

  __VUE_HMR_RUNTIME__.reload = function (id, newComp) {
    const plugins = window.panel && window.panel.plugins
    const app = window.panel && window.panel.app

    if (
      plugins
      && app
      && plugins.components
      && typeof plugins.resolveComponentExtension === 'function'
      && typeof plugins.resolveComponentRender === 'function'
      && typeof plugins.resolveComponentMixins === 'function'
    ) {
      for (const name in plugins.components) {
        const pluginComp = plugins.components[name]
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

    return originalReload.call(this, id, newComp)
  }
}
else {
  console.warn(
    '[kirbyup] Vue HMR runtime not detected; component changes will fall back to full page reload. The Kirby Panel may be loading a production build of Vue.',
  )
}
