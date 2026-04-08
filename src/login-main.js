import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import Login from './Login.vue'

const messages = {
  pt: { back: 'Voltar', welcomeBack: 'Bem-vindo de volta', join: 'Entra na', account: 'conta.', username: 'Nome de utilizador', password: 'Palavra-passe', login: 'Login', donthaveaccount: 'Ainda não tens conta?', register: 'Registo' },
  en: { back: 'Back', welcomeBack: 'Welcome back', join: 'Login', account: 'Account.', username: 'Username', password: 'Password', login: 'Login', donthaveaccount: "Don't have an account?", register: 'Register' }
}

const i18n = createI18n({ legacy: false, locale: localStorage.getItem('lang') || 'pt', messages })
createApp(Login).use(i18n).mount('#app')