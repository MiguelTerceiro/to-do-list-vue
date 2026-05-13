<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  pendingCount: {
    type: Number,
    required: true
  },
  doneCount: {
    type: Number,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  }
})

const { t } = useI18n()
</script>

<template>
  <div class="stats">
    <article class="stat-card pending">
      <span class="stat-num pending">{{ pendingCount }}</span>
      <span class="stat-label">{{ t('stats.pending') }}</span>
    </article>

    <article class="stat-card done">
      <span class="stat-num done">{{ doneCount }}</span>
      <span class="stat-label">{{ t('stats.done') }}</span>
    </article>

    <article class="stat-card total">
      <span class="stat-num total">{{ totalCount }}</span>
      <span class="stat-label">{{ t('stats.total') }}</span>
    </article>
  </div>
</template>
