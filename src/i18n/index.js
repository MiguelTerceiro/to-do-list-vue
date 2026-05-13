import { ref } from 'vue'
import en from './en'
import pt from './pt'

const messages = { pt, en }
const fallbackLocale = 'pt'

const hasLocale = (value) => Object.prototype.hasOwnProperty.call(messages, value)

const readStoredLocale = () => {
  const storedLocale = localStorage.getItem('lang') || fallbackLocale
  return hasLocale(storedLocale) ? storedLocale : fallbackLocale
}

const readByPath = (source, path) =>
  path.split('.').reduce((value, segment) => {
    if (value && typeof value === 'object') {
      return value[segment]
    }

    return undefined
  }, source)

export const locale = ref(readStoredLocale())

export const setLocale = (value) => {
  locale.value = hasLocale(value) ? value : fallbackLocale
  localStorage.setItem('lang', locale.value)
}

export const t = (key) => {
  const activeMessages = messages[locale.value] || messages[fallbackLocale]

  return readByPath(activeMessages, key) ?? readByPath(messages[fallbackLocale], key) ?? key
}

export default {
  locale,
  messages,
  setLocale,
  t
}
