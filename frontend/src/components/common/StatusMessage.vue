<script setup>
defineProps({
  message: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'error'
  }
})
</script>

<template>
  <p v-if="message" :class="['status-message', type]">
    {{ message }}
  </p>
</template>
