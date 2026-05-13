<template>
  <div class="auth-page-wrap">
    <div class="auth-shell">
      <section class="auth-showcase">
        <div>
          <p class="panel-kicker">{{ t('auth.register.badge') }}</p>
          <h1 class="showcase-title">
            {{ t('auth.register.new') }}<br /><span>{{ t('common.register') }}</span>
          </h1>
          <p class="showcase-copy">{{ t('auth.register.copy') }}</p>
        </div>
      </section>

      <section class="auth-card">
        <div class="auth-card-top">
          <span class="auth-tag">{{ t('auth.register.createAccount') }}</span>
          <h2 class="auth-form-title">{{ t('common.register') }}</h2>
          <p class="auth-form-copy">{{ t('auth.register.formCopy') }}</p>
        </div>

        <form v-if="!verificationToken" @submit.prevent="handleRegisto">
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
            <label for="email">{{ t('common.email') }}</label>
            <input
              type="email"
              id="email"
              v-model="email"
              :placeholder="t('common.emailPlaceholder')"
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
          <button type="submit" class="auth-btn" :disabled="isSubmitting">
            {{ isSubmitting ? t('common.sending') : t('auth.register.createAccount') }}
          </button>
        </form>

        <form v-else @submit.prevent="handleRegisterVerification">
          <div class="field">
            <label for="register-code">{{ t('common.verificationCode') }}</label>
            <input
              type="text"
              id="register-code"
              v-model="verificationCode"
              inputmode="numeric"
              maxlength="6"
              :placeholder="t('common.codePlaceholder')"
              required
            />
          </div>
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
          {{ t('auth.register.googleAction') }}
        </a>

        <div v-if="!verificationToken" class="auth-link-row">
          {{ t('auth.register.alreadyHaveAccount') }} <a href="login.html">{{ t('common.login') }}</a>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { t } from './i18n'

const username = ref('')
const email = ref('')
const password = ref('')
const verificationCode = ref('')
const verificationToken = ref('')
const verificationEmail = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const handleRegisto = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  statusMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.value,
        email: email.value,
        password: password.value
      })
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      errorMessage.value = data?.erro || t('auth.register.errorDefault')
      return
    }

    if (data?.verificationRequired) {
      verificationToken.value = data.verificationToken
      verificationEmail.value = data.email || ''
      verificationCode.value = ''
      statusMessage.value = t('auth.register.codeSent').replace('{email}', verificationEmail.value)
      return
    }

    window.location.replace('login.html')
  } finally {
    isSubmitting.value = false
  }
}

const handleRegisterVerification = async () => {
  if (isSubmitting.value) return

  errorMessage.value = ''
  statusMessage.value = ''
  isSubmitting.value = true

  try {
    const response = await fetch('/register/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verificationToken: verificationToken.value,
        code: verificationCode.value
      })
    })

    const data = await response.json().catch(() => null)

    if (!response.ok) {
      errorMessage.value = data?.erro || t('auth.register.codeError')
      return
    }

    window.location.replace('login.html')
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
  }
})
</script>
