<script setup>
defineProps({
  currentLocale: {
    type: String,
    required: true
  }
})

const emit = defineEmits(['change'])
</script>

<template>
  <div class="lang-switcher">
    <button
      type="button"
      :class="{ active: currentLocale === 'pt' }"
      @click="emit('change', 'pt')"
    >
      PT
    </button>
    <button
      type="button"
      :class="{ active: currentLocale === 'en' }"
      @click="emit('change', 'en')"
    >
      EN
    </button>
  </div>
</template>
