import { createPinia } from 'pinia'
import { createApp } from 'vue'
import vue3GoogleLogin from 'vue3-google-login'
import App from './App.vue'
import i18n from './locales'
import { hydrateRuntimeConfig, runtimeConfig } from './services/runtimeConfig'
import './styles/main.css'

async function bootstrap() {
  await hydrateRuntimeConfig()

  const app = createApp(App)

  app.use(createPinia())
  app.use(i18n)

  if (runtimeConfig.googleClientId) {
    app.use(vue3GoogleLogin, {
      clientId: runtimeConfig.googleClientId
    })
  } else {
    console.warn('Google Client ID nao configurado. Login com Google desativado.')
  }

  app.mount('#app')
}

void bootstrap()
