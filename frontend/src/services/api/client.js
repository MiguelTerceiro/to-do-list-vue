import { getApiBaseUrl } from '../runtimeConfig'

const TOKEN_STORAGE_KEY = 'token'

function normalizeApiErrorMessage(payload, status, resource) {
  if (payload && typeof payload === 'object' && payload.message) {
    return payload.message
  }

  if (typeof payload === 'string') {
    const trimmedPayload = payload.trim()

    if (trimmedPayload.startsWith('<!DOCTYPE html>') || trimmedPayload.startsWith('<html')) {
      if (status === 404) {
        return `O endpoint ${resource} nao foi encontrado. Confirma se o backend correto desta app esta a correr.`
      }

      return 'O servidor respondeu com uma pagina HTML em vez de JSON. Confirma se a API desta app esta a correr.'
    }

    if (trimmedPayload) {
      return trimmedPayload
    }
  }

  return 'Erro no pedido.'
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY)
}

export function persistStoredToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token)
}

export async function apiRequest(resource, options = {}) {
  const headers = new Headers(options.headers || {})

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }

  const token = getStoredToken()

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let response

  try {
    response = await fetch(`${getApiBaseUrl()}${resource}`, {
      ...options,
      headers
    })
  } catch {
    const error = new Error(
      'Nao foi possivel ligar ao servidor. Confirma se o backend desta aplicacao esta a correr.'
    )
    error.status = 0
    throw error
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    const error = new Error(normalizeApiErrorMessage(payload, response.status, resource))
    error.status = response.status
    error.payload = payload
    throw error
  }

  return payload
}
