import {
  apiRequest,
  clearStoredToken,
  getStoredToken,
  persistStoredToken
} from './api/client'

const USER_STORAGE_KEY = 'currentUser'

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

export function hasStoredSession() {
  return Boolean(getStoredToken() && getStoredUser())
}

export function persistSession({ token, user }) {
  persistStoredToken(token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearSession() {
  clearStoredToken()
  localStorage.removeItem(USER_STORAGE_KEY)
}

export function loginUser(credentials) {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  })
}

export function registerUser(payload) {
  return apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export function loginWithGoogleUser(credential) {
  return apiRequest('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential })
  })
}
