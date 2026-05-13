<template>
  <div v-if="currentUserId" class="app-shell">
    <section class="hero-card">
      <div class="top-actions">
        <div class="hero-copy-block">
          <p class="panel-kicker">{{ t('todo.dashboardEyebrow') }}</p>
          <h1>{{ t('todo.titleLead') }}<br /><span>{{ t('todo.titleAccent') }}.</span></h1>
          <p class="hero-copy">{{ t('todo.heroCopy') }}</p>
        </div>

        <div class="session-panel">
          <span class="session-label">{{ t('todo.connectedAs') }}</span>
          <strong class="session-name">{{ currentUserName }}</strong>
          <span class="session-date">{{ todayLabel }}</span>
          <button class="btn-logs primary" @click="logout">{{ t('common.logout') }}</button>
        </div>
      </div>

      <div class="stats">
        <div class="stat">
          <span class="stat-label">{{ t('todo.tasksPending') }}</span>
          <span class="stat-num pending">{{ pendingCount }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">{{ t('todo.tasksDone') }}</span>
          <span class="stat-num done">{{ doneCount }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">{{ t('todo.tasksTotal') }}</span>
          <span class="stat-num total">{{ tasks.length }}</span>
        </div>
      </div>

      <div class="hero-progress" v-if="tasks.length > 0">
        <div class="progress-copy">
          <span>{{ t('todo.progressLabel') }}</span>
          <strong>{{ progressPct }}%</strong>
        </div>
        <div class="progress-wrap">
          <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
        </div>
      </div>
    </section>

    <section class="workspace-card">
      <div class="workspace-head">
        <div>
          <p class="panel-kicker">{{ t('todo.panelEyebrow') }}</p>
          <h2 class="section-title">{{ t('todo.panelTitle') }}</h2>
          <p class="section-copy">{{ t('todo.panelCopy') }}</p>
        </div>

        <div class="language-switch">
          <button class="button" :class="{ active: locale === 'pt' }" @click="changeLanguage('pt')">PT</button>
          <button class="button" :class="{ active: locale === 'en' }" @click="changeLanguage('en')">EN</button>
        </div>
      </div>

      <div class="composer">
        <div class="add-form">
          <input
            v-model="newTaskText"
            :placeholder="t('todo.placeholderNewTask')"
            @keyup.enter="addTask"
          />
          <button @click="addTask">{{ t('todo.addAction') }}</button>
        </div>
      </div>

      <div class="tabs">
        <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
          <span class="tab-dot all"></span> {{ t('todo.filters.all') }}
        </button>
        <button :class="{ active: filter === 'pending' }" @click="filter = 'pending'">
          <span class="tab-dot pending"></span> {{ t('todo.filters.pending') }}
        </button>
        <button :class="{ active: filter === 'done' }" @click="filter = 'done'">
          <span class="tab-dot done"></span> {{ t('todo.filters.done') }}
        </button>
      </div>

      <div v-if="errorMessage" class="status-banner status-error">{{ errorMessage }}</div>
      <div v-if="successMessage" class="status-banner status-success">{{ successMessage }}</div>
      <div v-if="isLoading && tasks.length === 0" class="status-banner">{{ t('todo.loading') }}</div>
      <div v-else-if="!errorMessage && filteredTasks.length === 0" class="empty-state">
        <div class="empty-state-orb"></div>
        <p class="empty-title">{{ emptyStateTitle }}</p>
        <p class="empty-copy">{{ t('todo.empty.copy') }}</p>
      </div>

      <ul v-else-if="filteredTasks.length > 0" class="task-list">
        <li
          v-for="task in filteredTasks"
          :key="task.id"
          class="task-item"
          :class="{ done: task.isDone }"
        >
          <div class="checkbox" @click="toggleDone(task)">
            <span v-if="task.isDone">&#10003;</span>
          </div>
          <div class="task-body">
            <input
              v-if="editingId === task.id"
              :id="'edit-' + task.id"
              v-model="editText"
              class="edit-input"
              @keyup.enter="saveEdit(task)"
              @keyup.escape="cancelEdit"
            />
            <div v-else class="task-text">{{ task.text }}</div>
            <div class="task-meta">
              <span class="task-date">{{ formatTaskDate(task.createdAt) }}</span>
              <span v-if="task.isShared" class="share-badge">
                {{ t('todo.sharedFrom') }} {{ task.ownerName || t('todo.defaultUser') }}
              </span>
            </div>
            <div v-if="sharingId === task.id" class="share-form">
              <div class="share-input-row">
                <input
                  v-model="shareEmail"
                  type="email"
                  :placeholder="t('todo.shareEmailPlaceholder')"
                  @input="searchShareUsers"
                  @keyup.enter="shareTask(task)"
                  @keyup.escape="cancelShare"
                />
                <button type="button" class="share-send" @click="shareTask(task)">
                  <span>&rarr;</span>
                  {{ t('todo.shareConfirm') }}
                </button>
              </div>
              <div v-if="shareSuggestions.length > 0" class="share-suggestions">
                <button
                  v-for="user in shareSuggestions"
                  :key="user.id"
                  type="button"
                  class="share-suggestion"
                  @click="selectShareSuggestion(user)"
                >
                  <strong>{{ user.email }}</strong>
                  <span>{{ user.nome }}</span>
                </button>
              </div>
              <p
                v-if="isSearchingUsers"
                class="share-hint"
              >
                {{ t('todo.shareSearching') }}
              </p>
              <p
                v-else-if="shareSuggestions.length === 0 && shareEmail.trim().length >= 2"
                class="share-hint"
              >
                {{ t('todo.shareNoResults') }}
              </p>
            </div>
          </div>
          <div class="task-actions">
            <template v-if="editingId === task.id">
              <button class="icon-btn confirm" :title="t('todo.actions.save')" :aria-label="t('todo.actions.save')" @click="saveEdit(task)">&#10003;</button>
              <button class="icon-btn danger" :title="t('todo.actions.cancel')" :aria-label="t('todo.actions.cancel')" @click="cancelEdit">&#10005;</button>
            </template>
            <template v-else>
              <button class="icon-btn" :title="t('todo.actions.edit')" :aria-label="t('todo.actions.edit')" @click="startEdit(task)">&#9998;</button>
              <button v-if="task.canShare" class="icon-btn share-open" :title="t('todo.actions.share')" :aria-label="t('todo.actions.share')" @click="startShare(task)">
                &rarr;
              </button>
              <button v-if="task.canDelete" class="icon-btn danger" :title="t('todo.actions.delete')" :aria-label="t('todo.actions.delete')" @click="removeTask(task.id)">X</button>
            </template>
          </div>
        </li>
      </ul>

      <button class="clear-btn" v-if="clearableDoneCount > 0" @click="clearDone">
        {{ t('todo.clearDone') }} ({{ clearableDoneCount }})
      </button>
    </section>
  </div>

  <div v-else class="redirect-screen">
    <div class="redirect-card">
      <p class="panel-kicker">{{ t('todo.redirecting') }}</p>
      <p class="redirect-copy">{{ t('todo.redirectCopy') }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { locale, setLocale, t } from './i18n'

const newTaskText = ref('')
const filter = ref('all')
const editingId = ref(null)
const editText = ref('')
const sharingId = ref(null)
const shareEmail = ref('')
const shareSuggestions = ref([])
const isSearchingUsers = ref(false)
const tasks = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const currentUser = ref(getStoredUser())

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const currentUserName = computed(() => {
  locale.value
  return currentUser.value?.nome || t('todo.defaultUser')
})

const todayLabel = computed(() => {
  const dateLocale = locale.value === 'pt' ? 'pt-PT' : 'en-US'
  return new Intl.DateTimeFormat(dateLocale, {
    weekday: 'long',
    day: '2-digit',
    month: 'long'
  }).format(new Date())
})

const emptyStateTitle = computed(() => {
  locale.value

  if (filter.value === 'done') return t('todo.empty.done')
  if (filter.value === 'pending') return t('todo.empty.pending')
  return t('todo.empty.none')
})

const currentUserId = computed(() => {
  const parsedId = Number.parseInt(currentUser.value?.utilizador_id ?? currentUser.value?.id, 10)
  return Number.isNaN(parsedId) ? null : parsedId
})

const navigate = (page, replace = false) => {
  if (replace) {
    window.location.replace(page)
    return
  }

  window.location.href = page
}

const apiRequest = async (url, options = {}) => {
  const requestOptions = {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  }

  const response = await fetch(url, requestOptions)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.erro || t('todo.unexpectedError'))
  }

  return data
}

const formatTaskDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const dateLocale = locale.value === 'pt' ? 'pt-PT' : 'en-US'
  return new Intl.DateTimeFormat(dateLocale).format(date)
}

const replaceTask = (updatedTask) => {
  const taskIndex = tasks.value.findIndex((task) => task.id === updatedTask.id)
  if (taskIndex === -1) return

  tasks.value.splice(taskIndex, 1, updatedTask)
}

const loadTasks = async ({ clearStatus = true } = {}) => {
  if (clearStatus) {
    errorMessage.value = ''
    successMessage.value = ''
  }

  if (!currentUserId.value) return

  isLoading.value = true

  try {
    tasks.value = await apiRequest(`/api/tasks?utilizador_id=${currentUserId.value}`)
  } catch (error) {
    errorMessage.value = error.message || t('todo.loadError')
  } finally {
    isLoading.value = false
  }
}

const addTask = async () => {
  const text = newTaskText.value.trim()
  if (!text) return

  if (!currentUserId.value) {
    errorMessage.value = t('todo.loginRequired')
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const createdTask = await apiRequest('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        texto: text,
        utilizador_id: currentUserId.value
      })
    })

    tasks.value.unshift(createdTask)
    newTaskText.value = ''
  } catch (error) {
    errorMessage.value = error.message || t('todo.saveError')
  }
}

const updateTask = async (task, nextValues = {}) => {
  if (!currentUserId.value) {
    errorMessage.value = t('todo.loginRequired')
    return false
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const updatedTask = await apiRequest(`/api/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        texto: nextValues.texto ?? task.text,
        concluida: nextValues.concluida ?? task.isDone,
        utilizador_id: currentUserId.value
      })
    })

    replaceTask(updatedTask)
    return true
  } catch (error) {
    errorMessage.value = error.message || t('todo.saveError')
    return false
  }
}

const toggleDone = async (task) => {
  await updateTask(task, { concluida: !task.isDone })
}

const removeTask = async (id) => {
  if (!currentUserId.value) {
    errorMessage.value = t('todo.loginRequired')
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    await apiRequest(`/api/tasks/${id}?utilizador_id=${currentUserId.value}`, {
      method: 'DELETE'
    })

    tasks.value = tasks.value.filter((task) => task.id !== id)

    if (editingId.value === id) {
      cancelEdit()
    }
  } catch (error) {
    errorMessage.value = error.message || t('todo.deleteError')
  }
}

const startShare = (task) => {
  cancelEdit()
  sharingId.value = task.id
  shareEmail.value = ''
  shareSuggestions.value = []
}

const cancelShare = () => {
  clearTimeout(shareSearchTimeout)
  sharingId.value = null
  shareEmail.value = ''
  shareSuggestions.value = []
  isSearchingUsers.value = false
}

let shareSearchTimeout = null

const searchShareUsers = () => {
  clearTimeout(shareSearchTimeout)

  const query = shareEmail.value.trim()
  shareSuggestions.value = []

  if (!currentUserId.value || query.length < 2) {
    isSearchingUsers.value = false
    return
  }

  isSearchingUsers.value = true
  shareSearchTimeout = setTimeout(async () => {
    try {
      const users = await apiRequest(
        `/api/users/search?query=${encodeURIComponent(query)}&utilizador_id=${currentUserId.value}`
      )

      if (shareEmail.value.trim() === query) {
        shareSuggestions.value = users
      }
    } catch {
      shareSuggestions.value = []
    } finally {
      isSearchingUsers.value = false
    }
  }, 180)
}

const selectShareSuggestion = (user) => {
  shareEmail.value = user.email
  shareSuggestions.value = []
}

const shareTask = async (task) => {
  const email = shareEmail.value.trim()
  if (!email) return

  if (!currentUserId.value) {
    errorMessage.value = t('todo.loginRequired')
    return
  }

  errorMessage.value = ''
  successMessage.value = ''

  try {
    const shareResult = await apiRequest(`/api/tasks/${task.id}/share`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        utilizador_id: currentUserId.value
      })
    })

    const sharedUser = shareResult.sharedWith?.nome || shareResult.sharedWith?.email || email
    cancelShare()
    await loadTasks({ clearStatus: false })
    successMessage.value = shareResult.notificationSent
      ? t('todo.shareSuccessWith').replace('{user}', sharedUser)
      : t('todo.shareSuccessWithNoEmail').replace('{user}', sharedUser)
  } catch (error) {
    errorMessage.value = error.message || t('todo.shareError')
  }
}

const startEdit = (task) => {
  cancelShare()
  editingId.value = task.id
  editText.value = task.text
}

const saveEdit = async (task) => {
  const text = editText.value.trim()
  if (!text) return

  const saved = await updateTask(task, { texto: text })
  if (saved) {
    editingId.value = null
  }
}

const cancelEdit = () => {
  editingId.value = null
  editText.value = ''
}

const clearDone = async () => {
  if (!currentUserId.value) {
    errorMessage.value = t('todo.loginRequired')
    return
  }

  const completedTasks = tasks.value.filter((task) => task.isDone && task.canDelete)
  if (completedTasks.length === 0) return

  errorMessage.value = ''
  successMessage.value = ''

  try {
    await Promise.all(
      completedTasks.map((task) =>
        apiRequest(`/api/tasks/${task.id}?utilizador_id=${currentUserId.value}`, {
          method: 'DELETE'
        })
      )
    )

    tasks.value = tasks.value.filter((task) => !task.isDone)
  } catch (error) {
    errorMessage.value = error.message || t('todo.deleteError')
  }
}

const logout = () => {
  localStorage.removeItem('user')
  currentUser.value = null
  tasks.value = []
  newTaskText.value = ''
  filter.value = 'all'
  cancelEdit()
  cancelShare()
  errorMessage.value = ''
  successMessage.value = ''
  navigate('login.html', true)
}

const changeLanguage = (lang) => {
  setLocale(lang)
}

const filteredTasks = computed(() => {
  if (filter.value === 'done') return tasks.value.filter((task) => task.isDone)
  if (filter.value === 'pending') return tasks.value.filter((task) => !task.isDone)
  return tasks.value
})

const doneCount = computed(() => tasks.value.filter((task) => task.isDone).length)
const clearableDoneCount = computed(
  () => tasks.value.filter((task) => task.isDone && task.canDelete).length
)
const pendingCount = computed(() => tasks.value.filter((task) => !task.isDone).length)
const progressPct = computed(() => {
  if (tasks.value.length === 0) return 0
  return Math.round((doneCount.value / tasks.value.length) * 100)
})

onMounted(() => {
  if (!currentUserId.value) {
    navigate('login.html', true)
    return
  }

  loadTasks()
})
</script>
