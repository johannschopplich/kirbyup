import TailwindSection from './components/TailwindSection.vue'
import './index.css'

window.panel.plugin('kirbyup/tailwindcss', {
  sections: {
    tailwind: TailwindSection,
  },
})
