const app = Vue.createApp({
  data() {
    return {
      newTaskText: '',

      filter: 'all',

      editingId: null,

      editText: '',

      tasks: [
        
      ]
    }
  },

  methods: {
    addTask() {
      const text = this.newTaskText.trim()
      if (!text) return

      this.tasks.unshift({
        id: Date.now(),
        text: text,
        isDone: false,
        date: new Date().toLocaleDateString('pt-PT')
      })

      this.newTaskText = ''
      this.persist()
    },

    toggleDone(task) {
      task.isDone = !task.isDone
      this.persist()
    },

    removeTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id)
      this.persist()
    },

    startEdit(task) {
      this.editingId = task.id
      this.editText  = task.text

      this.$nextTick(() => {
        const input = document.getElementById('edit-' + task.id)
        if (input) input.focus()
      })
    },

    saveEdit(task) {
      const text = this.editText.trim()
      if (text) task.text = text
      this.editingId = null
      this.persist()
    },

    cancelEdit() {
      this.editingId = null
    },

    clearDone() {
      this.tasks = this.tasks.filter(t => !t.isDone)
      this.persist()
    },

    persist() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks))
    }
  },

  computed: {
    filteredTasks() {
      if (this.filter === 'done')    return this.tasks.filter(t => t.isDone)
      if (this.filter === 'pending') return this.tasks.filter(t => !t.isDone)
      return this.tasks
    },

    doneCount() {
      return this.tasks.filter(t => t.isDone).length
    },

    pendingCount() {
      return this.tasks.filter(t => !t.isDone).length
    },

    progressPct() {
      if (!this.tasks.length) return 0
      return Math.round((this.doneCount / this.tasks.length) * 100)
    }
  }
})

app.mount('#app')