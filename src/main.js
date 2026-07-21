import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import './styles/main.css'
import App from './App.vue'

const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'dark',
    themes: {
      dark: {
        dark: true,
        colors: {
          background: '#0a0a1a',
          surface: 'rgba(255, 255, 255, 0.06)',
          'surface-variant': 'rgba(255, 255, 255, 0.1)',
          primary: '#6C63FF',
          secondary: '#00D9FF',
          accent: '#FF6B9D',
          error: '#FF5252',
          info: '#2196F3',
          success: '#4CAF50',
          warning: '#FFC107',
        },
      },
    },
  },
  defaults: {
    VBtn: {
      variant: 'flat',
      rounded: 'lg',
    },
    VCard: {
      rounded: 'xl',
    },
    VTextField: {
      variant: 'outlined',
      rounded: 'xl',
      density: 'comfortable',
    },
  },
})

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(vuetify)
app.mount('#app')

// Hide skeleton loader after mount
requestAnimationFrame(() => {
  const skeleton = document.getElementById('skeleton-loader')
  if (skeleton) {
    skeleton.style.opacity = '0'
    setTimeout(() => {
      skeleton.style.display = 'none'
    }, 300)
  }
})
