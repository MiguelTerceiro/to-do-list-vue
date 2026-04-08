import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'

const messages = {
  pt: {
    My: 'Minhas',
    Tasks: 'Tarefas',
    headerLabel: 'lista de tarefas',
    tasksPending: 'A fazer',
    tasksDone: 'Concluídas',
    tasksTotal: 'Total',
    placeholderNewTask: 'Nova tarefa',
    tabs: { all: 'Todas', pending: 'A Fazer', done: 'Concluídas' },
    empty: { done: 'Nenhuma tarefa concluída ainda.', pending: 'Nenhuma tarefa pendente!', none: 'Adiciona a tua primeira tarefa.' },
    clearDone: 'Limpar concluídas',
    register: 'Registo',
    login: 'Login',
    back: 'Voltar',
    createAccount: 'Criar conta',
    new: 'Novo',
    username: 'Nome de utilizador',
    email: 'Email',
    password: 'Palavra-passe',
    ahaaccount: 'Já tens conta?',
    welcomeBack: 'Bem-vindo de volta',
    join: 'Entra na',
    account: 'conta.',
    donthaveaccount: 'Ainda não tens conta?'
  },
  en: {
    My: 'My',
    Tasks: 'Tasks',
    headerLabel: 'task list',
    tasksPending: 'Pending',
    tasksDone: 'Done',
    tasksTotal: 'Total',
    placeholderNewTask: 'New task',
    tabs: { all: 'All', pending: 'Pending', done: 'Done' },
    empty: { done: 'No completed tasks yet.', pending: 'No pending tasks!', none: 'Add your first task.' },
    clearDone: 'Clear done',
    register: 'Register',
    login: 'Login',
    back: 'Back',
    createAccount: 'Create account',
    new: 'New',
    username: 'Username',
    email: 'Email',
    password: 'Password',
    ahaaccount: 'Already have an account?',
    welcomeBack: 'Welcome back',
    join: 'Login',
    account: 'Account.',
    donthaveaccount: 'Don\'t have an account?'
  }
}

const savedLang = localStorage.getItem('lang') || 'pt'

const i18n = createI18n({
  legacy: true,
  locale: savedLang,
  messages
})

const app = createApp({
  data() {
    return {
      newTaskText: '',
      filter: 'all',
      editingId: null,
      editText: '',
      tasks: [],
      currentLang: savedLang
    }
  },

  methods: {
    addTask() {
      const text = this.newTaskText.trim()
      if (!text) return

      this.tasks.unshift({
        id: Date.now(),
        text,
        isDone: false,
        date: new Date().toLocaleDateString(this.currentLang === 'pt' ? 'pt-PT' : 'en-US')
      })
      this.newTaskText = ''
      this.persist()
    },

    toggleDone(task) { task.isDone = !task.isDone; this.persist() },
    removeTask(id) { this.tasks = this.tasks.filter(t => t.id !== id); this.persist() },
    startEdit(task) { this.editingId = task.id; this.editText = task.text; this.$nextTick(() => { const input = document.getElementById('edit-' + task.id); if (input) input.focus() }) },
    saveEdit(task) { const text = this.editText.trim(); if(text) task.text = text; this.editingId = null; this.persist() },
    cancelEdit() { this.editingId = null },
    clearDone() { this.tasks = this.tasks.filter(t => !t.isDone); this.persist() },
    persist() { localStorage.setItem('tasks', JSON.stringify(this.tasks)) },

    changeLanguage(lang) {
      this.$i18n.locale = lang
      this.currentLang = lang
      localStorage.setItem('lang', lang)
    }
  },

  computed: {
    filteredTasks() {
      if (this.filter === 'done') return this.tasks.filter(t => t.isDone)
      if (this.filter === 'pending') return this.tasks.filter(t => !t.isDone)
      return this.tasks
    },
    doneCount() { return this.tasks.filter(t => t.isDone).length },
    pendingCount() { return this.tasks.filter(t => !t.isDone).length },
    progressPct() { return this.tasks.length ? Math.round((this.doneCount / this.tasks.length) * 100) : 0 }
  },

  mounted() {
    const saved = localStorage.getItem('tasks')
    if (saved) this.tasks = JSON.parse(saved)
  }
})

app.use(i18n)
app.mount('#app')