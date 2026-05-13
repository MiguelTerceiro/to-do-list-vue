import { apiRequest } from './api/client'
import { mapApiTask } from '../utils/taskMapper'

export async function fetchTasks(locale) {
  const data = await apiRequest('/tasks')
  return data.map((task) => mapApiTask(task, locale))
}

export async function fetchSharedTasks(locale) {
  const data = await apiRequest('/tasks/shared')

  return data.map((task) =>
    mapApiTask(
      {
        ...task,
        isShared: true
      },
      locale
    )
  )
}

export async function createTask(title, locale) {
  const data = await apiRequest('/tasks', {
    method: 'POST',
    body: JSON.stringify({ title })
  })

  return mapApiTask(data, locale)
}

export async function updateTask(taskId, payload, locale, options = {}) {
  const data = await apiRequest(`/tasks/${taskId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })

  return mapApiTask(
    options.isShared
      ? {
          ...data,
          isShared: true
        }
      : data,
    locale
  )
}

export function deleteTask(taskId) {
  return apiRequest(`/tasks/${taskId}`, {
    method: 'DELETE'
  })
}

export async function shareTask(taskId, identifier, locale) {
  const data = await apiRequest(`/tasks/${taskId}/share`, {
    method: 'POST',
    body: JSON.stringify({ identifier })
  })

  return {
    ...data,
    task: data.task ? mapApiTask(data.task, locale) : null
  }
}
