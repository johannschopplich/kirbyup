// Vue 3 doesn't have a separate HMR runtime module to intercept.
// Instead, we inject wrapper code into each Vue component.

/**
 * This code is injected into Vue 3 components to wrap the global HMR runtime.
 *
 * All `.vue` components register themselves with the HMR runtime (`__VUE_HMR_RUNTIME__`),
 * which stores their component definitions in a map. When a module is updated, the runtime
 * applies changes to the stored definition and re-renders component instances.
 *
 * In Vue 3, the HMR map structure is:
 * ```js
 * {
 *   [id]: { initialDef: ComponentDefinition, instances: Set<ComponentInstance> }
 * }
 * ```
 *
 * However, Kirby does not register the exact object exported from a `.vue` file.
 * Instead, it creates a new object and merges the definition in:
 * https://github.com/getkirby/kirby/blob/main/panel/public/js/plugins.js
 *
 * After HMR changes, the runtime updates the stored definition and re-renders instances,
 * but since they are derived from Kirby's modified object (not the stored definition),
 * updates may not apply correctly.
 *
 * To fix this, we wrap `__VUE_HMR_RUNTIME__.rerender()` and `__VUE_HMR_RUNTIME__.reload()`:
 *
 * 1. **Before updates**, we check if the component belongs to a Kirby plugin by matching
 *    the `__hmrId` or `__file` properties against registered plugin components.
 *
 * 2. **If matched**, we look up the actual component definition used by Kirby
 *    (`window.panel.app.config.globalProperties.$root.$options.components`)
 *    and update the HMR map's reference to point to it.
 *
 * 3. **For section components** (detected by `k-*-section` name pattern), we add a
 *    `$_isSection` flag for special treatment in `$_applyKirbyModifications()`.
 *
 * `$_applyKirbyModifications()`:
 *
 * Kirby modifies component definitions before registration:
 * - Adds the section mixin to section components
 * - Gives templates priority over render functions
 * - Resolves component names in `extends` to their definition objects
 *
 * When a module hot reloads, Vue 3 receives a fresh component definition missing
 * these modifications. We re-apply them to ensure the runtime doesn't prune them
 * when patching the stored definition with the updated one.
 *
 * This code uses a singleton pattern (`__KIRBYUP_HMR_WRAPPED__`) to ensure the
 * wrapper is installed only once, even though it's injected into every component.
 */
export const __HMR_INJECTION_CODE__ = `
/** - injected by kirbyup for Vue 3 HMR - */
if (typeof __VUE_HMR_RUNTIME__ !== 'undefined' && !window.__KIRBYUP_HMR_WRAPPED__) {
  window.__KIRBYUP_HMR_WRAPPED__ = true;

  const originalRerender = __VUE_HMR_RUNTIME__.rerender;
  const originalReload = __VUE_HMR_RUNTIME__.reload;

  __VUE_HMR_RUNTIME__.rerender = function(id, newRender) {
    $_syncKirbyComponent(id);
    return originalRerender.call(this, id, newRender);
  };

  __VUE_HMR_RUNTIME__.reload = function(id, newComp) {
    const record = $_getHmrRecord(id);
    if (record) {
      $_syncKirbyComponent(id, record.initialDef);
      $_applyKirbyModifications(record.initialDef, newComp);
    }
    return originalReload.call(this, id, newComp);
  };

  function $_getHmrRecord(id) {
    // Vue 3's HMR map is not exposed, so we maintain our own parallel map
    // by wrapping \`createRecord\` to track component definitions
    if (!window.__KIRBYUP_MAP__) {
      window.__KIRBYUP_MAP__ = new Map();
      const originalCreate = __VUE_HMR_RUNTIME__.createRecord;
      __VUE_HMR_RUNTIME__.createRecord = function(id, initialDef) {
        window.__KIRBYUP_MAP__.set(id, { initialDef });
        return originalCreate.call(this, id, initialDef);
      };
    }
    return window.__KIRBYUP_MAP__.get(id);
  }

  function $_syncKirbyComponent(id, activeDef) {
    const pluginComponents = window.panel?.plugins?.components;
    const usedComponentDefs = window.panel?.app?.config?.globalProperties?.$root?.$options?.components;

    if (!pluginComponents || !usedComponentDefs) return;

    const record = $_getHmrRecord(id);
    if (!record) return;

    for (const componentName in pluginComponents) {
      const pluginComp = pluginComponents[componentName];

      if (pluginComp.__hmrId === id || pluginComp.__file === record.initialDef?.__file) {
        const usedDef = usedComponentDefs[componentName];

        if (usedDef && record.initialDef !== usedDef) {
          record.initialDef = usedDef;
        }

        if (activeDef && typeof activeDef.$_isSection !== 'boolean') {
          activeDef.$_isSection = /^k-.*-section$/.test(componentName);
        }

        break;
      }
    }
  }

  function $_applyKirbyModifications(activeDef, newDef) {
    const usedComponentDefs = window.panel?.app?.config?.globalProperties?.$root?.$options?.components;

    if (!usedComponentDefs) return;

    // Give templates priority over render functions
    if (newDef.template) {
      newDef.render = null;
    }

    // Re-apply section mixin for section components
    if (activeDef.$_isSection) {
      newDef.$_isSection = true;
      if (!newDef.mixins?.[0]?.methods?.load) {
        const sectionMixin = activeDef.mixins?.[0];
        if (sectionMixin) {
          newDef.mixins = [sectionMixin, ...(newDef.mixins || [])];
        }
      }
    }

    // Resolve component name in extends to definition object
    if (typeof newDef.extends === 'string') {
      if (newDef.extends === activeDef.extends?.name) {
        newDef.extends = activeDef.extends;
      } else if (usedComponentDefs[newDef.extends]) {
        newDef.extends = usedComponentDefs[newDef.extends];
      } else {
        newDef.extends = null;
      }
    }
  }
}
/** -- */
`
