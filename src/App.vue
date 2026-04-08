<template>
  <button class="btn-logs" @click="navigate('login.html')">{{ $t('login') }}</button>
  <button class="btn-logs" @click="navigate('registo.html')">{{ $t('register') }}</button>

  <p class="header-label">{{ $t('headerLabel') }}</p>
  <h1>{{ $t('My') }}<br /><span>{{ $t('Tasks') }}.</span></h1>

  <div class="stats">
    <div class="stat">
      <span class="stat-num pending">{{ pendingCount }}</span>
      <span class="stat-label">{{ $t('tasksPending') }}</span>
    </div>
    <div class="stat">
      <span class="stat-num done">{{ doneCount }}</span>
      <span class="stat-label">{{ $t('tasksDone') }}</span>
    </div>
    <div class="stat">
      <span class="stat-num total">{{ tasks.length }}</span>
      <span class="stat-label">{{ $t('tasksTotal') }}</span>
    </div>
  </div>

  <div class="progress-wrap" v-if="tasks.length > 0">
    <div class="progress-bar" :style="{ width: progressPct + '%' }"></div>
  </div>

  <div class="add-form">
    <input v-model="newTaskText" :placeholder="$t('placeholderNewTask')" @keyup.enter="addTask" />
    <button @click="addTask">+</button>
  </div>

  <div class="tabs">
    <button :class="{ active: filter === 'all' }" @click="filter = 'all'">
      <span class="tab-dot all"></span> {{ $t('all') }}
    </button>
    <button :class="{ active: filter === 'pending' }" @click="filter = 'pending'">
      <span class="tab-dot pending"></span> {{ $t('pending') }}
    </button>
    <button :class="{ active: filter === 'done' }" @click="filter = 'done'">
      <span class="tab-dot done"></span> {{ $t('done') }}
    </button>
  </div>

  <ul>
    <div v-if="filteredTasks.length === 0" class="empty">
      <span v-if="filter === 'done'">{{ $t('done2') }}</span>
      <span v-else-if="filter === 'pending'">{{ $t('pending2') }}</span>
      <span v-else>{{ $t('none') }}</span>
    </div>
    <li v-for="task in filteredTasks" :key="task.id" :class="{ done: task.isDone }">
      <div class="checkbox" @click="toggleDone(task)">
        <span v-if="task.isDone">✓</span>
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
        <div class="task-date">{{ task.date }}</div>
      </div>
      <div class="task-actions">
        <template v-if="editingId === task.id">
          <button class="icon-btn confirm" @click="saveEdit(task)">✓</button>
          <button class="icon-btn danger" @click="cancelEdit">✕</button>
        </template>
        <template v-else>
          <button class="icon-btn" @click="startEdit(task)">✎</button>
          <button class="icon-btn danger" @click="removeTask(task.id)">X</button>
        </template>
      </div>
    </li>
  </ul>

  <button class="clear-btn" v-if="doneCount > 0" @click="clearDone">
    {{ $t('clearDone') }} ({{ doneCount }})
  </button>
  <br>
  <button class="button" @click="changeLanguage('pt')">PT</button>
  <button class="button" @click="changeLanguage('en')">EN</button>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const newTaskText = ref('')
const filter = ref('all')
const editingId = ref(null)
const editText = ref('')
const tasks = ref(JSON.parse(localStorage.getItem('tasks') || '[]'))

const navigate = (page) => window.location.href = page

const persist = () => localStorage.setItem('tasks', JSON.stringify(tasks.value))

const addTask = () => {
  const text = newTaskText.value.trim()
  if (!text) return
  tasks.value.unshift({
    id: Date.now(), text, isDone: false,
    date: new Date().toLocaleDateString(locale.value === 'pt' ? 'pt-PT' : 'en-US')
  })
  newTaskText.value = ''
  persist()
}

const toggleDone = (task) => { task.isDone = !task.isDone; persist() }
const removeTask = (id) => { tasks.value = tasks.value.filter(t => t.id !== id); persist() }
const startEdit = (task) => { editingId.value = task.id; editText.value = task.text }
const saveEdit = (task) => { const text = editText.value.trim(); if (text) task.text = text; editingId.value = null; persist() }
const cancelEdit = () => { editingId.value = null }
const clearDone = () => { tasks.value = tasks.value.filter(t => !t.isDone); persist() }

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('lang', lang)
}

const filteredTasks = computed(() => {
  if (filter.value === 'done') return tasks.value.filter(t => t.isDone)
  if (filter.value === 'pending') return tasks.value.filter(t => !t.isDone)
  return tasks.value
})
const doneCount = computed(() => tasks.value.filter(t => t.isDone).length)
const pendingCount = computed(() => tasks.value.filter(t => !t.isDone).length)
const progressPct = computed(() => tasks.value.length ? Math.round((doneCount.value / tasks.value.length) * 100) : 0)
</script>