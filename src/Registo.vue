<template>
  <div class="auth-page-wrap">
    <div class="auth-card">
      <a href="index.html" class="back-btn">{{ $t('back') }}</a>
      <div class="auth-eyebrow">{{ $t('createAccount') }}</div>
      <h1 class="auth-title">{{ $t('new') }}<br><span>{{ $t('register') }}</span></h1>

      <form @submit.prevent="handleRegisto">
        <div class="field">
          <label for="username">{{ $t('username') }}</label>
          <input type="text" id="username" v-model="username" placeholder="escolhe um utilizador" required>
        </div>
        <div class="field">
          <label for="email">{{ $t('email') }}</label>
          <input type="email" id="email" v-model="email" placeholder="teu@email.com" required>
        </div>
        <div class="field">
          <label for="password">{{ $t('password') }}</label>
          <input type="password" id="password" v-model="password" placeholder="••••••••" required>
        </div>
        <button type="submit" class="auth-btn">{{ $t('createAccount') }}</button>
      </form>

      <div class="auth-footer">
        {{ $t('ahaaccount') }} <a href="login.html">{{ $t('login') }}</a>
      </div>
      <div class="card-dots">
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
        <span></span><span></span><span></span><span></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const username = ref('')
const email = ref('')
const password = ref('')

const handleRegisto = async () => {
  const res = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.value, email: email.value, password: password.value })
  })
  if (res.ok) window.location.href = 'login.html'
}
</script>