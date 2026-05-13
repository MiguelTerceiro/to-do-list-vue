import { defineStore } from 'pinia'
import * as taskService from '../services/taskService'
import { refreshTaskDate } from '../utils/taskMapper'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    items: [],
    sharedItems: [],
    filter: 'all',
    loading: false,
    saving: false,
    errorMessage: ''
  }),

  getters: {
    filteredTasks: (state) => {
      if (state.filter === 'done') {
        return state.items.filter((task) => task.completed)
      }

      if (state.filter === 'pending') {
        return state.items.filter((task) => !task.completed)
      }

      return state.items
    },

    doneCount: (state) => state.items.filter((task) => task.completed).length,
    pendingCount: (state) => state.items.filter((task) => !task.completed).length,
    progressPct() {
      if (!this.items.length) {
        return 0
      }

      return Math.round((this.doneCount / this.items.length) * 100)
    },

    hasCompletedTasks: (state) => state.items.some((task) => task.completed)
  },

  actions: {
    clearFeedback() {
      this.errorMessage = ''
    },

    clearItems() {
      this.items = []
      this.sharedItems = []
      this.filter = 'all'
      this.clearFeedback()
    },

    setFilter(nextFilter) {
      this.filter = nextFilter
    },

    refreshTaskDates(locale) {
      this.items = this.items.map((task) => refreshTaskDate(task, locale))
      this.sharedItems = this.sharedItems.map((task) => refreshTaskDate(task, locale))
    },

    async fetchTasks(locale) {
      this.loading = true
      this.clearFeedback()

      try {
        const [tasks, sharedTasks] = await Promise.all([
          taskService.fetchTasks(locale),
          taskService.fetchSharedTasks(locale)
        ])

        this.items = tasks
        this.sharedItems = sharedTasks
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async addTask(title, locale) {
      this.saving = true
      this.clearFeedback()

      try {
        const newTask = await taskService.createTask(title, locale)
        this.items.unshift(newTask)
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.saving = false
      }
    },

    async updateTask(taskId, payload, locale, options = {}) {
      this.saving = true
      this.clearFeedback()

      try {
        const updatedTask = await taskService.updateTask(taskId, payload, locale, options)

        if (options.isShared) {
          this.sharedItems = this.sharedItems.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          )
        } else {
          this.items = this.items.map((task) => (task.id === updatedTask.id ? updatedTask : task))
        }
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.saving = false
      }
    },

    async toggleTask(task, locale) {
      await this.updateTask(
        task.id,
        {
          completed: !task.completed
        },
        locale,
        {
          isShared: task.isShared
        }
      )
    },

    async removeTask(taskId) {
      this.saving = true
      this.clearFeedback()

      try {
        await taskService.deleteTask(taskId)
        this.items = this.items.filter((task) => task.id !== taskId)
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.saving = false
      }
    },

    async clearCompleted() {
      this.saving = true
      this.clearFeedback()

      try {
        const completedTasks = this.items.filter((task) => task.completed)
        await Promise.all(completedTasks.map((task) => taskService.deleteTask(task.id)))
        this.items = this.items.filter((task) => !task.completed)
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.saving = false
      }
    },

    async shareTask(taskId, identifier, locale) {
      this.saving = true
      this.clearFeedback()

      try {
        const response = await taskService.shareTask(taskId, identifier, locale)

        if (response.task) {
          this.items = this.items.map((task) => (task.id === response.task.id ? response.task : task))
        }

        return response
      } finally {
        this.saving = false
      }
    }
  }
})
