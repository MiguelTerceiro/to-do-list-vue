import { defineStore } from 'pinia'
import {
  clearSession,
  getStoredUser,
  loginUser,
  loginWithGoogleUser,
  persistSession,
  registerUser
} from '../services/authService'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUser: getStoredUser(),
    loading: false,
    errorMessage: '',
    successMessage: ''
  }),

  getters: {
    isAuthenticated: (state) => Boolean(state.currentUser)
  },

  actions: {
    restoreSession() {
      this.currentUser = getStoredUser()
    },

    clearFeedback() {
      this.errorMessage = ''
      this.successMessage = ''
    },

    async login(credentials) {
      this.loading = true
      this.clearFeedback()

      try {
        const data = await loginUser(credentials)
        persistSession(data)
        this.currentUser = data.user
        this.successMessage = data.message
        return data.user
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async loginWithGoogle(credential) {
  this.loading = true
  this.clearFeedback()

  try {
    const data = await loginWithGoogleUser(credential)
    persistSession(data)
    this.currentUser = data.user
    this.successMessage = data.message
    return data.user
  } catch (error) {
    this.errorMessage = error.message
    throw error
  } finally {
    this.loading = false
  }
},

    async register(payload) {
      this.loading = true
      this.clearFeedback()

      try {
        const data = await registerUser(payload)
        this.successMessage = data.message
        return data
      } catch (error) {
        this.errorMessage = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    logout() {
      clearSession()
      this.currentUser = null
      this.clearFeedback()
    }
  }
})