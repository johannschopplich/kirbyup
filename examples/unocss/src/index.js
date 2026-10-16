import DemoField from './components/DemoField.vue'
import 'virtual:uno.css'

window.panel.plugin('kirbyup/unocss', {
  fields: {
    demo: DemoField,
  },
})
