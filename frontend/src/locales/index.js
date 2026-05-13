import { createI18n } from 'vue-i18n'
import en from './en'
import pt from './pt'

export default createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'pt',
  fallbackLocale: 'pt',
  messages: {
    pt,
    en
  }
})
