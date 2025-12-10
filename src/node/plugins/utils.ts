export const HMR_RUNTIME_ID = '\0plugin-vue2:hmr-runtime'
export const JSX_HMR_RUNTIME_ID = 'plugin-vue2-jsx:hmr-runtime'

export function isHmrRuntimeId(id: string): boolean {
  return id === HMR_RUNTIME_ID || id === JSX_HMR_RUNTIME_ID
}

/**
 * This code is injected into the HMR runtime of plugin-vue2(-jsx).
 *
 * All `.vue` components register themselves once with the HMR runtime, so their exported
 * component definitions can be stored in a map, alongside the rendered component instances
 * that are based off this definition. When a module is updated, the runtime applies all
 * changes from the updated module to the stored definition, then re-renders the instances.
 *
 * ```js
 * {
 *   [id]: { options: ComponentDefinition, instances: [...] }
 * }
 * ```
 *
 * However, in some cases (sections and blocks) Kirby does not actually register the
 * object that is exported from a `.vue` file (and stored as definition) as component,
 * instead it creates a new object and merges the definition from the `.vue` file in:
 * https://github.com/getkirby/kirby/blob/main/panel/public/js/plugins.js#L22-L25
 * After changes, the runtime updates the definition and re-renders the instances, but since
 * they are derived from the object created by Kirby, not the stored definition, nothing happens.
 * To fix that, we wrap `rerender()` and `reload()` so that before applying the updates, we first check
 * if the updated definition belongs to a component added by a Kirby plugin. To do so, we can check
 * whether the `__file` (added by plugin-vue2) or `__hmrId` (added by plugin-vue2-jsx) properties of the
 * updated module and the plugin component match. If so, we look up the component definition that is
 * _actually_ used by component instances rendered on the page (`window.panel.app.$options.components`)
 * and if it differs from the one stored in the HMR runtime's map, we updates the map's reference.
 *
 * We also check the component name and add a `$_isSection` flag if it's `k-something-section`, because
 * section components are hard to detect and need special treatment in `$_applyKirbyModifications`.
 *
 * `$_applyKirbyModifications`:
 *
 * Kirby modifies component definitions before registering components.
 * This includes adding the section mixin to section components,
 * giving templates priority over render functions if both exist
 * and resolving component names in `extends` to their definition object:
 * https://github.com/getkirby/kirby/blob/2965c3124e3b141072a2d46c798a327dda710060/panel/src/panel/plugins.js
 * When a module is reloaded, Vue receives a fresh component definition that is
 * missing these modifications. We need to re-apply them, else the runtime will
 * prune them when patching the stored definition to match the newer one.
 *
 * The call to `$_applyKirbyModifications()` is injected into `__VUE_HMR_RUNTIME__.reload()`
 * at the appropriate position using a RegExp in the Vite plugin's transform method.
 */
export const __INJECTED_HMR_CODE__ = `
/** - injected by kirbyup - */
for (const methodName of ['rerender', 'reload']) {
  const original = __VUE_HMR_RUNTIME__[methodName]

  __VUE_HMR_RUNTIME__[methodName] = function (id, updatedDef) {
    const key = updatedDef?.__file ? '__file' : updatedDef?.__hmrId ? '__hmrId' : null

    if (key) {
      const pluginComponents = window.panel.plugins.components
      // const usedComponentDefs = window.panel.app.$options.components
      const usedComponentDefs = window.panel.app._vnode.componentInstance.$options.components // #33

      for (const componentName in pluginComponents) {
        if (updatedDef[key] === pluginComponents[componentName][key]) {
          const usedDefinition = usedComponentDefs[componentName].options

          if (map[id].options !== usedDefinition)
            map[id].options = usedDefinition

          if (typeof map[id].options.$_isSection !== 'boolean')
            map[id].options.$_isSection = /^k-.*-section$/.test(componentName)

          break
        }
      }
    }

    return original.apply(this, arguments)
  }
}

function $_applyKirbyModifications(activeDef, newDef) {
  const usedComponentDefs = window.panel.app.$options.components

  if (newDef.template)
    newDef.render = null

  if (activeDef.$_isSection)
    newDef.$_isSection = true
  if (newDef.$_isSection && !newDef.mixins?.[0]?.methods?.load)
    newDef.mixins = [activeDef.mixins[0], ...(newDef.mixins || [])]

  if (typeof newDef.extends === 'string') {
    if (newDef.extends === activeDef.extends?.options?.name) {
      newDef.extends = activeDef.extends
    }
    else if (usedComponentDefs[newDef.extends]) {
      newDef.extends = usedComponentDefs[newDef.extends].extend({
        options: newDef,
        components: { ...usedComponentDefs, ...(newDef.components || {}) },
      })
    }
    else { newDef.extends = null }
  }
}
/** -- */
`
