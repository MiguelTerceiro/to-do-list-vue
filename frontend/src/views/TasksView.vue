<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import StatusMessage from '../components/common/StatusMessage.vue'
import TaskFilters from '../components/tasks/TaskFilters.vue'
import TaskItem from '../components/tasks/TaskItem.vue'
import TaskStats from '../components/tasks/TaskStats.vue'
import { useAuthStore } from '../stores/auth'
import { useTaskStore } from '../stores/tasks'
import { validateTaskTitle } from '../utils/validators'

const { locale, t } = useI18n()
const authStore = useAuthStore()
const taskStore = useTaskStore()

const newTaskTitle = ref('')
const editingTaskId = ref(null)
const editDraft = ref('')
const sharingTaskId = ref(null)
const shareDraft = ref('')
const formError = ref('')
const editError = ref('')
const shareError = ref('')
const shareMessage = ref('')

const todayLabel = computed(() =>
  new Intl.DateTimeFormat(locale.value, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date())
)

const emptyMessage = computed(() => {
  if (taskStore.filter === 'done') {
    return t('empty.done')
  }

  if (taskStore.filter === 'pending') {
    return t('empty.pending')
  }

  return t('empty.all')
})

function handleUnauthorized(error) {
  if (error.status === 401) {
    authStore.logout()
    taskStore.clearItems()
  }
}

function resetEditing() {
  editingTaskId.value = null
  editDraft.value = ''
  editError.value = ''
}

function resetSharing() {
  sharingTaskId.value = null
  shareDraft.value = ''
  shareError.value = ''
}

function startEdit(task) {
  resetSharing()
  editingTaskId.value = task.id
  editDraft.value = task.title
  editError.value = ''
}

function startShare(task) {
  resetEditing()
  sharingTaskId.value = task.id
  shareDraft.value = ''
  shareError.value = ''
  shareMessage.value = ''
}

async function handleAddTask() {
  formError.value = validateTaskTitle(newTaskTitle.value, t)

  if (formError.value) {
    return
  }

  try {
    await taskStore.addTask(newTaskTitle.value, locale.value)
    newTaskTitle.value = ''
    formError.value = ''
  } catch (error) {
    handleUnauthorized(error)
  }
}

async function handleToggleTask(task) {
  try {
    await taskStore.toggleTask(task, locale.value)
  } catch (error) {
    handleUnauthorized(error)
  }
}

async function handleSaveEdit(task) {
  editError.value = validateTaskTitle(editDraft.value, t)

  if (editError.value) {
    return
  }

  try {
    await taskStore.updateTask(
      task.id,
      {
        title: editDraft.value.trim()
      },
      locale.value,
      {
        isShared: false
      }
    )

    resetEditing()
  } catch (error) {
    handleUnauthorized(error)
  }
}

async function handleShareTask(task) {
  const identifier = shareDraft.value.trim()

  if (!identifier) {
    shareError.value = t('validation.shareIdentifierRequired')
    return
  }

  try {
    const response = await taskStore.shareTask(task.id, identifier, locale.value)
    shareMessage.value = response.message || t('shared.success')
    resetSharing()
  } catch (error) {
    if (error.status === 401) {
      handleUnauthorized(error)
      return
    }

    shareError.value = error.message
    shareMessage.value = ''
  }
}

async function handleRemoveTask(taskId) {
  try {
    await taskStore.removeTask(taskId)

    if (editingTaskId.value === taskId) {
      resetEditing()
    }

    if (sharingTaskId.value === taskId) {
      resetSharing()
    }
  } catch (error) {
    handleUnauthorized(error)
  }
}

async function handleClearCompleted() {
  if (!window.confirm(t('prompts.clearDone'))) {
    return
  }

  try {
    await taskStore.clearCompleted()
    resetEditing()
  } catch (error) {
    handleUnauthorized(error)
  }
}

function handleLogout() {
  authStore.logout()
  taskStore.clearItems()
  newTaskTitle.value = ''
  formError.value = ''
  shareMessage.value = ''
  resetEditing()
  resetSharing()
}

watch(locale, (newLocale) => {
  taskStore.refreshTaskDates(newLocale)
})

onMounted(async () => {
  if (
    authStore.isAuthenticated &&
    !taskStore.items.length &&
    !taskStore.sharedItems.length &&
    !taskStore.loading
  ) {
    try {
      await taskStore.fetchTasks(locale.value)
    } catch (error) {
      handleUnauthorized(error)
    }
  }
})
</script>

<template>
  <section class="task-panel">
    <div class="task-topline">
      <div class="headline-card">
        <p class="header-label">{{ t('header.label') }}</p>
        <h1>{{ t('header.title') }}<br /><span>{{ t('header.subtitle') }}</span></h1>
        <p class="panel-copy">{{ t('header.description') }}</p>

        <div class="hero-strip task-strip">
          <span>{{ todayLabel }}</span>
          <span>{{ taskStore.items.length }} {{ t('stats.total') }}</span>
        </div>
      </div>

      <div class="task-topside">
        <div class="user-bar">
          <div class="user-profile">
            <div class="user-meta">
              <strong>{{ t('auth.greeting', { name: authStore.currentUser.username }) }}</strong>
              <span>{{ todayLabel }}</span>
            </div>
          </div>

          <button type="button" class="ghost-btn" @click="handleLogout">
            {{ t('auth.logout') }}
          </button>
        </div>

        <div class="overview-card">
          <div class="overview-head">
            <span class="overview-label">{{ t('stats.progress') }}</span>
            <span class="overview-chip">{{ taskStore.items.length }} {{ t('stats.total') }}</span>
          </div>

          <strong class="overview-value">{{ taskStore.progressPct }}%</strong>
          <span class="overview-meta">
            {{ taskStore.doneCount }} {{ t('stats.done') }} /
            {{ taskStore.pendingCount }} {{ t('stats.pending') }}
          </span>

          <div class="progress-wrap">
            <div class="progress-bar" :style="{ width: `${taskStore.progressPct}%` }"></div>
          </div>
        </div>
      </div>
    </div>

    <StatusMessage :message="taskStore.errorMessage" />
    <StatusMessage :message="shareMessage" type="success" />

    <TaskStats
      :pending-count="taskStore.pendingCount"
      :done-count="taskStore.doneCount"
      :total-count="taskStore.items.length"
    />

    <div class="task-workspace">
      <div class="workspace-head">
        <div>
          <p class="form-kicker">{{ t('header.workspaceKicker') }}</p>
          <h2 class="workspace-title">{{ t('header.workspaceTitle') }}</h2>
          <p class="workspace-copy">{{ t('header.workspaceDescription') }}</p>
        </div>

        <TaskFilters
          :filter="taskStore.filter"
          :pending-count="taskStore.pendingCount"
          :done-count="taskStore.doneCount"
          :total-count="taskStore.items.length"
          @change="taskStore.setFilter"
        />
      </div>

      <div class="composer">
        <label class="field-group composer-field">
          <span class="field-label">{{ t('form.taskLabel') }}</span>
          <input
            v-model="newTaskTitle"
            :placeholder="t('form.placeholder')"
            :disabled="taskStore.saving"
            @keyup.enter="handleAddTask"
          />
          <span v-if="formError && !editingTaskId" class="field-error">{{ formError }}</span>
        </label>

        <button
          type="button"
          class="primary-btn"
          :disabled="taskStore.saving"
          @click="handleAddTask"
        >
          {{ taskStore.saving ? t('actions.adding') : t('actions.add') }}
        </button>
      </div>

      <div v-if="taskStore.loading" class="empty">
        <span class="empty-badge">...</span>
        <strong class="empty-title">{{ t('loading.tasks') }}</strong>
        <p class="empty-copy">{{ t('header.workspaceDescription') }}</p>
      </div>

      <div v-else-if="taskStore.filteredTasks.length === 0" class="empty">
        <span class="empty-badge">00</span>
        <strong class="empty-title">{{ emptyMessage }}</strong>
        <p class="empty-copy">{{ t('header.workspaceDescription') }}</p>
      </div>

      <ul v-else class="task-list">
        <TaskItem
          v-for="task in taskStore.filteredTasks"
          :key="task.id"
          :task="task"
          :is-editing="editingTaskId === task.id"
          :draft-title="editDraft"
          :edit-error="editError"
          :is-share-open="sharingTaskId === task.id"
          :share-draft="shareDraft"
          :share-error="sharingTaskId === task.id ? shareError : ''"
          :disabled="taskStore.saving"
          @toggle-done="handleToggleTask"
          @start-edit="startEdit"
          @save-edit="handleSaveEdit"
          @cancel-edit="resetEditing"
          @start-share="startShare"
          @cancel-share="resetSharing"
          @confirm-share="handleShareTask"
          @remove-task="handleRemoveTask"
          @update:draft-title="editDraft = $event"
          @update:share-draft="shareDraft = $event"
        />
      </ul>

      <button
        v-if="taskStore.hasCompletedTasks"
        type="button"
        class="clear-btn"
        :disabled="taskStore.saving"
        @click="handleClearCompleted"
      >
        {{
          taskStore.saving ? t('actions.clearing') : `${t('actions.clearDone')} (${taskStore.doneCount})`
        }}
      </button>

      <div class="shared-workspace">
        <div class="workspace-head shared-head">
          <div>
            <p class="form-kicker">{{ t('shared.kicker') }}</p>
            <h2 class="workspace-title">{{ t('shared.title') }}</h2>
            <p class="workspace-copy">{{ t('shared.description') }}</p>
          </div>

          <span class="overview-chip">{{ taskStore.sharedItems.length }} {{ t('shared.count') }}</span>
        </div>

        <div v-if="taskStore.sharedItems.length === 0" class="empty shared-empty">
          <span class="empty-badge">SH</span>
          <strong class="empty-title">{{ t('shared.empty') }}</strong>
          <p class="empty-copy">{{ t('shared.description') }}</p>
        </div>

        <ul v-else class="task-list shared-list">
          <TaskItem
            v-for="task in taskStore.sharedItems"
            :key="`shared-${task.id}-${task.ownerId}`"
            :task="task"
            :is-editing="false"
            :draft-title="''"
            :disabled="taskStore.saving"
            @toggle-done="handleToggleTask"
          />
        </ul>
      </div>
    </div>
  </section>
</template>
