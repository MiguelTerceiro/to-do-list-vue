import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

const messages = {
  pt: {
    My: 'Minhas', Tasks: 'Tarefas',
    tasksPending: 'A fazer', tasksDone: 'Concluídas', tasksTotal: 'Total',
    placeholderNewTask: 'Nova tarefa',
    all: 'Todas', pending: 'A Fazer', done: 'Concluídas',
    done2: 'Nenhuma tarefa concluída ainda.', pending2: 'Nenhuma tarefa pendente!', none: 'Adiciona a tua primeira tarefa.',
    clearDone: 'Limpar concluídas', register: 'Registo', login: 'Login', or: 'ou'
  },
  en: {
    My: 'My', Tasks: 'Tasks',
    tasksPending: 'Pending', tasksDone: 'Done', tasksTotal: 'Total',
    placeholderNewTask: 'New task',
    all: 'All', pending: 'Pending', done: 'Done',
    done2: 'No completed tasks yet.', pending2: 'No pending tasks!', none: 'Add your first task.',
    clearDone: 'Clear done', register: 'Register', login: 'Login', or: 'or'
  }
}

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('lang') || 'pt',
  messages
})

createApp(App).use(i18n).mount('#app')