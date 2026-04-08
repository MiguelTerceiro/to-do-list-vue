import { createApp } from 'vue'
import { createI18n } from 'vue-i18n' 
import Registo from './Registo.vue'

const messages = {
  pt: { back: 'Voltar', createAccount: 'Criar conta', new: 'Novo', register: 'Registo', username: 'Nome de utilizador', email: 'Email', password: 'Palavra-passe', ahaaccount: 'Já tens conta?', login: 'Login' },
  en: { back: 'Back', createAccount: 'Create account', new: 'New', register: 'Register', username: 'Username', email: 'Email', password: 'Password', ahaaccount: 'Already have an account?', login: 'Login' }
}

const i18n = createI18n({ legacy: false, locale: localStorage.getItem('lang') || 'pt', messages })
createApp(Registo).use(i18n).mount('#app')