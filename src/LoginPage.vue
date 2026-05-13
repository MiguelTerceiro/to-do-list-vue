<template>
  <div class="auth-page-wrap">
    <div class="auth-shell">
      <section class="auth-showcase">
        <div>
          <p class="panel-kicker">{{ t('auth.login.badge') }}</p>
          <h1 class="showcase-title">
            {{ t('auth.login.join') }}<br /><span>{{ t('auth.login.account') }}</span>
          </h1>
          <p class="showcase-copy">{{ t('auth.login.copy') }}</p>
        </div>
      </section>

      <section class="auth-card">
        <div class="auth-card-top">
          <span class="auth-tag">{{ t('auth.login.welcomeBack') }}</span>
          <h2 class="auth-form-title">{{ t('common.login') }}</h2>
          <p class="auth-form-copy">{{ t('auth.login.formCopy') }}</p>
        </div>

        <form v-if="!verificationToken" @submit.prevent="handleLogin">
          <div class="field">
            <label for="username">{{ t('common.username') }}</label>
            <input
              type="text"
              id="username"
              v-model="username"
              :placeholder="t('common.usernamePlaceholder')"
              required
            />
          </div>
          <div class="field">
            <label for="password">{{ t('common.password') }}</label>
            <input
              type="password"
              id="password"
              v-model="password"
              :placeholder="t('common.passwordPlaceholder')"
              required
            />
          </div>
          <label class="auth-option">
            <input type="checkbox" v-model="rememberLogin" />
            <span>{{ t('auth.login.rememberLogin') }}</span>
          </label>
          <button type="submit" class="auth-btn" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.sending') : t('common.login') }}
          </button>
        </form>

        <form v-else @submit.prevent="handleLoginVerification">
          <div class="field">
            <label for="login-code">{{ t('common.verificationCode') }}</label>
            <input
              type="text"
              id="login-code"
              v-model="verificationCode"
              inputmode="numeric"
              maxlength="6"
              :placeholder="t('common.codePlaceholder')"
              required
            />
          </div>
          <label class="auth-option">
            <input type="checkbox" v-model="rememberLogin" />
            <span>{{ t('auth.login.rememberLogin') }}</span>
          </label>
          <button type="submit" class="auth-btn" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.sending') : t('common.confirmCode') }}
          </button>
          <button type="button" class="auth-secondary-btn" :disabled="isSubmitting" @click="resetVerification">
            {{ t('common.changeData') }}
          </button>
        </form>

        <div v-if="errorMessage" class="status-banner status-error compact">{{ errorMessage }}</div>
        <div v-else-if="statusMessage" class="status-banner status-success compact">{{ statusMessage }}</div>

        <div v-if="!verificationToken" class="auth-divider"><span>{{ t('common.or') }}</span></div>
        <a v-if="!verificationToken" class="google-btn" href="/auth/google">
          <span class="google-mark">G</span>
          {{ t('auth.login.googleAction') }}
        </a>
        <div v-if="!verificationToken" class="auth-link-row">
          {{ t('auth.login.dontHaveAccount') }} <a href="registo.html">{{ t('common.register') }}</a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { t } from './i18n'

const username = ref('')
const password = ref('')
const verificationCode = ref('')
const verificationToken = ref('')
const verificationEmail = ref('')
const rememberLogin = ref(Boolean(localStorage.getItem('trustedLoginToken')))
const isSubmitting = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')
const authErrorMessages = {
  google_missing_config: 'auth.login.googleMissingConfig',
  google_denied: 'auth.login.googleDenied',
  google_invalid_state: 'auth.login.googleInvalidState',
  google_failed: 'auth.login.googleFailed'
}

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const handleLogin = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  statusMessage.value = ''
  isSubmitting.value = true

  if (!rememberLogin.value) {
    localStorage.removeItem('trustedLoginToken')
  }

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
        trustedLoginToken: rememberLogin.value ? localStorage.getItem('trustedLoginToken') : ''
      })
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      errorMessage.value = data?.erro || t('auth.login.errorDefault')
      return
    }

    if (data?.verificationRequired) {
      verificationToken.value = data.verificationToken
      verificationEmail.value = data.email || ''
      verificationCode.value = ''
      statusMessage.value = t('auth.login.codeSent').replace('{email}', verificationEmail.value)
      return
    }

    localStorage.setItem('user', JSON.stringify(data))
    window.location.replace('index.html')
  } finally {
    isSubmitting.value = false
  }
}

const handleLoginVerification = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  statusMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await fetch('/login/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: verificationToken.value,
        code: verificationCode.value,
        rememberLogin: rememberLogin.value
      })
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      errorMessage.value = data?.erro || t('auth.login.codeError')
      return
    }

    if (data?.trustedLoginToken) {
      localStorage.setItem('trustedLoginToken', data.trustedLoginToken)
    } else {
      localStorage.removeItem('trustedLoginToken')
    }

    localStorage.setItem('user', JSON.stringify(data))
    window.location.replace('index.html')
  } finally {
    isSubmitting.value = false
  }
}

const resetVerification = () => {
  verificationToken.value = ''
  verificationEmail.value = ''
  verificationCode.value = ''
  statusMessage.value = ''
  errorMessage.value = ''
}

onMounted(() => {
  if (getStoredUser()?.utilizador_id) {
    window.location.replace('index.html')
    return
  }

  const authError = new URLSearchParams(window.location.search).get('auth_error')
  if (authError) {
    errorMessage.value = t(authErrorMessages[authError] || 'auth.login.googleFailed')
    window.history.replaceState({}, '', 'login.html')
  }
})
</script>
