<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthTabs from '../components/auth/AuthTabs.vue'
import LoginForm from '../components/auth/LoginForm.vue'
import RegisterForm from '../components/auth/RegisterForm.vue'
import StatusMessage from '../components/common/StatusMessage.vue'
import { runtimeConfig } from '../services/runtimeConfig'
import { useAuthStore } from '../stores/auth'
import { useTaskStore } from '../stores/tasks'
import { validateLoginForm, validateRegisterForm } from '../utils/validators'

const { locale, t } = useI18n()
const authStore = useAuthStore()
const taskStore = useTaskStore()
const googleLoginEnabled = computed(() => Boolean(runtimeConfig.googleClientId))

const authMode = ref('login')

const loginForm = reactive({
  email: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  email: '',
  password: ''
})

const loginErrors = reactive({
  email: '',
  password: ''
})

const registerErrors = reactive({
  username: '',
  email: '',
  password: ''
})

function clearObject(target) {
  Object.keys(target).forEach((key) => {
    target[key] = ''
  })
}

function resetLoginForm() {
  loginForm.email = ''
  loginForm.password = ''
  clearObject(loginErrors)
}

function resetRegisterForm() {
  registerForm.username = ''
  registerForm.email = ''
  registerForm.password = ''
  clearObject(registerErrors)
}

function switchMode(mode) {
  authMode.value = mode
  authStore.clearFeedback()
  clearObject(loginErrors)
  clearObject(registerErrors)
}

function applyErrors(target, errors) {
  clearObject(target)
  Object.entries(errors).forEach(([key, value]) => {
    target[key] = value
  })
}

const authCardContent = computed(() => {
  if (authMode.value === 'register') {
    return {
      title: t('auth.registerTitle'),
      text: t('auth.registerText')
    }
  }

  return {
    title: t('auth.loginTitle'),
    text: t('auth.loginText')
  }
})

async function handleLogin() {
  const errors = validateLoginForm(loginForm, t)
  applyErrors(loginErrors, errors)

  if (Object.keys(errors).length > 0) {
    return
  }

  try {
    await authStore.login({
      email: loginForm.email,
      password: loginForm.password
    })

    resetLoginForm()
    await taskStore.fetchTasks(locale.value)
  } catch {
    // feedback already handled by the store
  }
}

async function handleGoogleLogin(response) {
  const credential = response.credential

  if (!credential) {
    authStore.errorMessage = 'Erro ao obter credencial Google.'
    return
  }

  try {
    await authStore.loginWithGoogle(credential)
    await taskStore.fetchTasks(locale.value)
  } catch {
    // feedback already handled by the store
  }
}

async function handleRegister() {
  const errors = validateRegisterForm(registerForm, t)
  applyErrors(registerErrors, errors)

  if (Object.keys(errors).length > 0) {
    return
  }

  try {
    await authStore.register({
      username: registerForm.username,
      email: registerForm.email,
      password: registerForm.password
    })

    loginForm.email = registerForm.email
    loginForm.password = ''
    resetRegisterForm()
    authMode.value = 'login'
  } catch {
    // feedback already handled by the store
  }
}
</script>

<template>
  <section class="auth-box">
    <div class="auth-hero">
      <div>
        <p class="header-label">{{ t('auth.label') }}</p>
        <h1>{{ t('auth.welcome') }}<br /><span>{{ t('auth.back') }}</span></h1>
        <p class="hero-copy">{{ t('auth.description') }}</p>
      </div>

      <div class="hero-highlights">
        <article class="highlight-card">
          <span class="highlight-index">01</span>
          <strong>{{ t('auth.highlightFocus') }}</strong>
        </article>

        <article class="highlight-card">
          <span class="highlight-index">02</span>
          <strong>{{ t('auth.highlightFlow') }}</strong>
        </article>

        <article class="highlight-card">
          <span class="highlight-index">03</span>
          <strong>{{ t('auth.highlightProgress') }}</strong>
        </article>
      </div>

      <div class="hero-strip">
        <span>{{ t('auth.login') }}</span>
        <span>{{ t('auth.register') }}</span>
        <span>{{ t('header.label') }}</span>
      </div>
    </div>

    <div class="auth-card">
      <div class="auth-card-head">
        <p class="form-kicker">{{ t('auth.formKicker') }}</p>
        <h2>{{ authCardContent.title }}</h2>
        <p class="card-copy">{{ authCardContent.text }}</p>
      </div>

      <StatusMessage
        :message="authStore.errorMessage || authStore.successMessage"
        :type="authStore.errorMessage ? 'error' : 'success'"
      />

      <AuthTabs
        :model-value="authMode"
        :login-label="t('auth.login')"
        :register-label="t('auth.register')"
        @update:model-value="switchMode"
      />

      <LoginForm
        v-if="authMode === 'login'"
        :email="loginForm.email"
        :password="loginForm.password"
        :errors="loginErrors"
        :loading="authStore.loading"
        :email-label="t('auth.email')"
        :password-label="t('auth.password')"
        :email-placeholder="t('auth.email')"
        :password-placeholder="t('auth.password')"
        :submit-label="authStore.loading ? t('auth.loadingLogin') : t('auth.submitLogin')"
        :show-google-login="googleLoginEnabled"
        @update:email="loginForm.email = $event"
        @update:password="loginForm.password = $event"
        @submit="handleLogin"
        @google-login="handleGoogleLogin"
      />

      <RegisterForm
        v-else
        :username="registerForm.username"
        :email="registerForm.email"
        :password="registerForm.password"
        :errors="registerErrors"
        :loading="authStore.loading"
        :username-label="t('auth.username')"
        :email-label="t('auth.email')"
        :password-label="t('auth.password')"
        :username-placeholder="t('auth.username')"
        :email-placeholder="t('auth.email')"
        :password-placeholder="t('auth.password')"
        :submit-label="authStore.loading ? t('auth.loadingRegister') : t('auth.submitRegister')"
        @update:username="registerForm.username = $event"
        @update:email="registerForm.email = $event"
        @update:password="registerForm.password = $event"
        @submit="handleRegister"
      />
    </div>
  </section>
</template>
