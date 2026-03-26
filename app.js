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
      const text = this.newTaskText.trim() //trim() remove os espaços em branco no início e no fim da string
      if (!text) return

      this.tasks.unshift({ //unshift() adiciona um novo elemento no início do array
        id: Date.now(),
        text: text,
        isDone: false, //significa que a tarefa vem por defeito como pendente 
        date: new Date().toLocaleDateString('pt-PT')
      })

      this.newTaskText = '' //caixa de texto fica vazia depois de adicionar a tarefa
      this.persist() //mesmo que feche a página as tarefas ficam guardadas no localStorage
    },

    toggleDone(task) {  //toggle = alternar
      task.isDone = !task.isDone
      this.persist()
    },

    removeTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id) //nao permite usar o mesmo id para mais do que uma tarefa
      this.persist()
    },

    startEdit(task) {
      this.editingId = task.id //guarda o id da tarefa que está a ser editada para mostrar o campo de ed
      this.editText  = task.text //guarda o texto da tarefa que está a ser editada para mostrar no campo de edição

      this.$nextTick(() => { //nexttick() atualiza a interface antes de executar a função para garantir que o campo de edição já está visível
        const input = document.getElementById('edit-' + task.id) //procura o campo de edição pelo id para focar nele automaticamente
        if (input) input.focus()
      })
    },

    saveEdit(task) {
      const text = this.editText.trim() //criamos uma variavel local para guardar o texto da variavel editText
      if (text) task.text = text
      this.editingId = null
      this.persist()
    },

    cancelEdit() {
      this.editingId = null//cancela a edição e volta ao estado normal sem salvar as alterações
    },

    clearDone() {
      this.tasks = this.tasks.filter(t => !t.isDone)// filter cria um novo array apenas com as tarefas que não estão marcadas como feitas, ou seja, as pendentes
      this.persist()
    },

    persist() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks)) //json.stringify guarda as tarefas no localStorage como uma string, já que o localStorage só aceita strings
    }
  },

  computed: {
    filteredTasks() {
      if (this.filter === 'done')    return this.tasks.filter(t => t.isDone) //mostra as feitas
      if (this.filter === 'pending') return this.tasks.filter(t => !t.isDone) //mostra as pendentes
      return this.tasks  //mostra todas as tarefas
    },

    doneCount() {
      return this.tasks.filter(t => t.isDone).length //t => t.isDone mostra as feitas e o length conta quantas tarefas estão feitas
    },

    pendingCount() {
      return this.tasks.filter(t => !t.isDone).length //igual ao de cima mas pendentes
    },

    progressPct() {
      if (!this.tasks.length) return 0 //se nao tiver tarefas, o progresso é 0%
      return Math.round((this.doneCount / this.tasks.length) * 100) //faz a conta das tarefas feitas (math.round arredondamentos) this.doneCount sao as feitas e this.tasks.length sao as tarefas totais. faz a conta entre elas
    }
  }
})

app.mount('#app')