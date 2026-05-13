import { reactive } from 'vue'

const fallbackApiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').trim() || '/api'
const initialGoogleClientId = String(import.meta.env.VITE_GOOGLE_CLIENT_ID || '').trim()

export const runtimeConfig = reactive({
  apiBaseUrl: fallbackApiBaseUrl,
  googleClientId: initialGoogleClientId
})

export function getApiBaseUrl() {
  return runtimeConfig.apiBaseUrl
}

export async function hydrateRuntimeConfig() {
  if (runtimeConfig.googleClientId) {
    return runtimeConfig
  }

  try {
    const response = await fetch(`${runtimeConfig.apiBaseUrl}/auth/config`, {
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return runtimeConfig
    }

    const payload = await response.json()
    runtimeConfig.googleClientId = String(payload.googleClientId || '').trim()
  } catch {
    // Keep the interface available even when the backend config endpoint is offline.
  }

  return runtimeConfig
}
