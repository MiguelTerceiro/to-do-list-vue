<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  filter: {
    type: String,
    required: true
  },
  totalCount: {
    type: Number,
    required: true
  },
  pendingCount: {
    type: Number,
    required: true
  },
  doneCount: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['change'])
const { t } = useI18n()

const filters = [
  { value: 'all', dotClass: 'all', labelKey: 'tabs.all' },
  { value: 'pending', dotClass: 'pending', labelKey: 'tabs.pending' },
  { value: 'done', dotClass: 'done', labelKey: 'tabs.done' }
]

const filterCountMap = computed(() => ({
  all: props.totalCount,
  pending: props.pendingCount,
  done: props.doneCount
}))
</script>

<template>
  <div class="tabs filter-tabs">
    <button
      v-for="item in filters"
      :key="item.value"
      type="button"
      :class="{ active: filter === item.value }"
      @click="emit('change', item.value)"
    >
      <span class="tab-copy">
        <span class="tab-dot" :class="item.dotClass"></span>
        <span class="tab-label">{{ t(item.labelKey) }}</span>
      </span>
      <span class="tab-count">{{ filterCountMap[item.value] }}</span>
    </button>
  </div>
</template>
