<script setup>
defineProps({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  errors: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  emailLabel: {
    type: String,
    required: true
  },
  passwordLabel: {
    type: String,
    required: true
  },
  emailPlaceholder: {
    type: String,
    required: true
  },
  passwordPlaceholder: {
    type: String,
    required: true
  },
  submitLabel: {
    type: String,
    required: true
  },
  showGoogleLogin: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:email', 'update:password', 'submit', 'google-login'])

function handleGoogleLogin(response) {
  emit('google-login', response)
}
</script>

<template>
  <div class="auth-form">
    <label class="field-group">
      <span class="field-label">{{ emailLabel }}</span>
      <input
        :value="email"
        type="email"
        autocomplete="email"
        :placeholder="emailPlaceholder"
        :disabled="loading"
        @input="emit('update:email', $event.target.value)"
        @keyup.enter="emit('submit')"
      />
      <span v-if="errors.email" class="field-error">{{ errors.email }}</span>
    </label>

    <label class="field-group">
      <span class="field-label">{{ passwordLabel }}</span>
      <input
        :value="password"
        type="password"
        autocomplete="current-password"
        :placeholder="passwordPlaceholder"
        :disabled="loading"
        @input="emit('update:password', $event.target.value)"
        @keyup.enter="emit('submit')"
      />
      <span v-if="errors.password" class="field-error">{{ errors.password }}</span>
    </label>

    <button type="button" class="primary-btn" :disabled="loading" @click="emit('submit')">
      {{ submitLabel }}
    </button>

    <div v-if="showGoogleLogin" :class="['google-login-wrapper', { 'is-disabled': loading }]">
      <GoogleLogin :callback="handleGoogleLogin" />
    </div>
  </div>
</template>
