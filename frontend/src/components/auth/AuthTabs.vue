<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  loginLabel: {
    type: String,
    required: true
  },
  registerLabel: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="tabs auth-tabs">
    <button
      type="button"
      :class="{ active: modelValue === 'login' }"
      @click="emit('update:modelValue', 'login')"
    >
      {{ loginLabel }}
    </button>
    <button
      type="button"
      :class="{ active: modelValue === 'register' }"
      @click="emit('update:modelValue', 'register')"
    >
      {{ registerLabel }}
    </button>
  </div>
</template>
