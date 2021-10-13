import TailwindDemoSection from './components/TailwindDemoSection.vue'
import './index.css'

window.panel.plugin('kirbyup/tailwindcss', {
  sections: {
    tailwind: TailwindDemoSection
  }
})
