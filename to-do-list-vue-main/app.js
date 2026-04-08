// ── Traduções ──────────────────────────────────────────────
const messages = {
  pt: {
    header:  { label: 'lista de tarefas', title: 'Minhas', subtitle: 'Tarefas.' },
    stats:   { pending: 'A fazer', done: 'Concluídas', total: 'Total' },
    form:    { placeholder: 'Nova tarefa' },
    tabs:    { all: 'Todas', pending: 'A Fazer', done: 'Concluídas' },
    empty:   { done: 'Nenhuma tarefa concluída ainda.', pending: 'Nenhuma tarefa pendente!', all: 'Adiciona a tua primeira tarefa.' },
    actions: { save: 'Guardar', cancel: 'Cancelar', edit: 'Editar', delete: 'Apagar', clearDone: 'Limpar concluídas' }
  },
  en: {
    header:  { label: 'task list', title: 'My', subtitle: 'Tasks.' },
    stats:   { pending: 'To do', done: 'Completed', total: 'Total' },
    form:    { placeholder: 'New task' },
    tabs:    { all: 'All', pending: 'To Do', done: 'Completed' },
    empty:   { done: 'No completed tasks yet.', pending: 'No pending tasks!', all: 'Add your first task.' },
    actions: { save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', clearDone: 'Clear completed' }
  }
}

const i18n = VueI18n.createI18n({
  legacy: false,
  locale: localStorage.getItem('locale') || 'pt', // lê preferência guardada
  messages
})

// ── App ────────────────────────────────────────────────────
const app = Vue.createApp({
  data() {
  return {
    newTaskText: '',
    filter: 'all',
    editingId: null,
    editText: '',
    tasks: JSON.parse(localStorage.getItem('tasks') || '[]'), // carrega tarefas guardadas
 
    currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'), // guarda o utilizador com sessão iniciada
    authMode: 'login', // controla se o formulário visível é o de login ou o de registo
 
    loginForm: {
      email: '',
      password: ''
    },
 
    registerForm: {
      username: '',
      email: '',
      password: ''
    }
  }
},

methods: {
  setLocale(lang) {
    i18n.global.locale.value = lang
    localStorage.setItem('locale', lang) // guarda preferência de idioma
  },
 
  async login() {
    try {
      // envia os dados do formulário de login para o backend validar o utilizador
      const res = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.loginForm)
      })
 
      const data = await res.json()
      alert(data.message)
 
      if (res.ok) {
        // guarda o token para usar mais tarde nas rotas protegidas
        localStorage.setItem('token', data.token)
 
        // guarda o utilizador atual no browser para manter a sessão iniciada
        localStorage.setItem('currentUser', JSON.stringify(data.user))
 
        this.currentUser = data.user
 
        // limpa os campos do formulário depois do login
        this.loginForm = {
          email: '',
          password: ''
        }
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao fazer login.')
    }
  },
 
  async register() {
    try {
      // envia os dados do formulário de registo para o backend
      const res = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.registerForm)
      })
 
      const data = await res.json()
      alert(data.message)
 
      if (res.ok) {
        // depois do registo, muda para o modo login
        this.authMode = 'login'
 
        // deixa o email já preenchido para facilitar a entrada
        this.loginForm.email = this.registerForm.email
        this.loginForm.password = ''
 
        // limpa os campos do formulário de registo
        this.registerForm = {
          username: '',
          email: '',
          password: ''
        }
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao registar.')
    }
  },

logout() {
  // remove os dados da sessão atual do browser
  localStorage.removeItem('token')
  localStorage.removeItem('currentUser')

  // volta ao estado sem utilizador autenticado
  this.currentUser = null
  this.authMode = 'login'
},  
 
  addTask() {
      const text = this.newTaskText.trim() // trim() remove os espaços em branco no início e no fim da string
      if (!text) return

      this.tasks.unshift({ // unshift() adiciona um novo elemento no início do array
        id: Date.now(),
        text: text,
        isDone: false, // significa que a tarefa vem por defeito como pendente
        date: new Date().toLocaleDateString(i18n.global.locale.value === 'en' ? 'en-GB' : 'pt-PT') // formato da data conforme o idioma ativo
      })

      this.newTaskText = '' // caixa de texto fica vazia depois de adicionar a tarefa
      this.persist() // mesmo que feche a página as tarefas ficam guardadas no localStorage
    },

    toggleDone(task) { // toggle = alternar
      task.isDone = !task.isDone
      this.persist()
    },

    removeTask(id) {
      this.tasks = this.tasks.filter(t => t.id !== id) // não permite usar o mesmo id para mais do que uma tarefa
      this.persist()
    },

    startEdit(task) {
      this.editingId = task.id // guarda o id da tarefa que está a ser editada para mostrar o campo de edição
      this.editText  = task.text // guarda o texto da tarefa que está a ser editada para mostrar no campo de edição

      this.$nextTick(() => { // nextTick() atualiza a interface antes de executar a função para garantir que o campo de edição já está visível
        const input = document.getElementById('edit-' + task.id) // procura o campo de edição pelo id para focar nele automaticamente
        if (input) input.focus()
      })
    },

    saveEdit(task) {
      const text = this.editText.trim() // criamos uma variável local para guardar o texto da variável editText
      if (text) task.text = text
      this.editingId = null
      this.persist()
    },

    cancelEdit() {
      this.editingId = null // cancela a edição e volta ao estado normal sem salvar as alterações
    },

    clearDone() {
      this.tasks = this.tasks.filter(t => !t.isDone) // filter cria um novo array apenas com as tarefas que não estão marcadas como feitas, ou seja, as pendentes
      this.persist()
    },

    persist() {
      localStorage.setItem('tasks', JSON.stringify(this.tasks)) // json.stringify guarda as tarefas no localStorage como uma string, já que o localStorage só aceita strings
    }
  },

  computed: {
    filteredTasks() {
      if (this.filter === 'done')    return this.tasks.filter(t =>  t.isDone) // mostra as feitas
      if (this.filter === 'pending') return this.tasks.filter(t => !t.isDone) // mostra as pendentes
      return this.tasks // mostra todas as tarefas
    },

    doneCount() {
      return this.tasks.filter(t => t.isDone).length // t => t.isDone mostra as feitas e o length conta quantas tarefas estão feitas
    },

    pendingCount() {
      return this.tasks.filter(t => !t.isDone).length // igual ao de cima mas pendentes
    },

    progressPct() {
      if (!this.tasks.length) return 0 // se não tiver tarefas, o progresso é 0%
      return Math.round((this.doneCount / this.tasks.length) * 100) // faz a conta das tarefas feitas (math.round arredondamentos) this.doneCount são as feitas e this.tasks.length são as tarefas totais
    }
  }
})

app.use(i18n)
app.mount('#app')
