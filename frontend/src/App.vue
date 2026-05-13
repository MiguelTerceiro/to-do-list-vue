<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import LanguageSwitcher from './components/common/LanguageSwitcher.vue'
import { useAuthStore } from './stores/auth'
import { useTaskStore } from './stores/tasks'
import AuthView from './views/AuthView.vue'
import TasksView from './views/TasksView.vue'

const { locale, t } = useI18n()
const authStore = useAuthStore()
const taskStore = useTaskStore()

function setLocale(nextLocale) {
  locale.value = nextLocale
  localStorage.setItem('locale', nextLocale)
  taskStore.refreshTaskDates(nextLocale)
}

async function bootstrapSession() {
  authStore.restoreSession()

  if (!authStore.isAuthenticated) {
    return
  }

  try {
    await taskStore.fetchTasks(locale.value)
  } catch (error) {
    if (error.status === 401) {
      authStore.logout()
    }
  }
}

onMounted(() => {
  localStorage.setItem('locale', locale.value)
  bootstrapSession()
})
</script>

<template>
  <div class="app-shell">
    <div class="app-toolbar">
      <div class="app-badge">
        <span class="app-badge-dot"></span>
        <span>{{ authStore.isAuthenticated ? t('header.label') : t('auth.label') }}</span>
      </div>

      <LanguageSwitcher :current-locale="locale" @change="setLocale" />
    </div>

    <AuthView v-if="!authStore.isAuthenticated" />
    <TasksView v-else />
  </div>
</template>
