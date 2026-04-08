<template>
  <div class="auth-page-wrap">
    <div class="auth-card">
      <a href="index.html" class="back-btn">{{ $t('back') }}</a>
      <div class="auth-eyebrow">{{ $t('welcomeBack') }}</div>
      <h1 class="auth-title">{{ $t('join') }}<br><span>{{ $t('account') }}</span></h1>

      <form @submit.prevent="handleLogin">
        <div class="field">
          <label for="username">{{ $t('username') }}</label>
          <input type="text" id="username" v-model="username" placeholder="Username" required>
        </div>
        <div class="field">
          <label for="password">{{ $t('password') }}</label>
          <input type="password" id="password" v-model="password" placeholder="••••••••" required>
        </div>
        <button type="submit" class="auth-btn">{{ $t('login') }}</button>
      </form>

      <div class="auth-divider"><span>ou</span></div>
      <div class="auth-footer">
        {{ $t('donthaveaccount') }} <a href="registo.html">{{ $t('register') }}</a>
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
const password = ref('')

const handleLogin = async () => {
  const res = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.value, password: password.value })
  })
  if (res.ok) window.location.href = 'index.html'
}
</script>