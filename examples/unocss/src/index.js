import DemoSection from './components/DemoSection.vue'
import 'virtual:uno.css'

window.panel.plugin('kirbyup/unocss', {
  sections: {
    demo: DemoSection,
  },
})
