<script setup>
defineProps({
  username: {
    type: String,
    required: true
  },
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
  usernameLabel: {
    type: String,
    required: true
  },
  emailLabel: {
    type: String,
    required: true
  },
  passwordLabel: {
    type: String,
    required: true
  },
  usernamePlaceholder: {
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
  }
})

const emit = defineEmits(['update:username', 'update:email', 'update:password', 'submit'])
</script>

<template>
  <div class="auth-form">
    <label class="field-group">
      <span class="field-label">{{ usernameLabel }}</span>
      <input
        :value="username"
        type="text"
        autocomplete="username"
        :placeholder="usernamePlaceholder"
        :disabled="loading"
        @input="emit('update:username', $event.target.value)"
        @keyup.enter="emit('submit')"
      />
      <span v-if="errors.username" class="field-error">{{ errors.username }}</span>
    </label>

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
        autocomplete="new-password"
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
  </div>
</template>
