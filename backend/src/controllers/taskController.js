import {
  createTaskForUser,
  createTaskShare,
  deleteTaskForUser,
  findTaskShare,
  getTaskById,
  getSharedTaskById,
  listSharedTasksForUser,
  listUserTasks,
  updateTaskById,
  updateTaskForUser
} from '../services/taskService.js'
import { getUserById, getUserByIdentifier } from '../services/authService.js'
import {
  sendTaskCompletedEmail,
  sendTaskCreatedEmail,
  sendTaskSharedEmail
} from '../services/emailService.js'

function parseTaskId(value) {
  const taskId = Number(value)
  return Number.isInteger(taskId) && taskId > 0 ? taskId : null
}

async function getTaskOwnerEmail(userId) {
  const user = await getUserById(userId)
  return user?.email || null
}

export async function getTasks(req, res) {
  try {
    const tasks = await listUserTasks(req.user.id)
    return res.status(200).json(tasks)
  } catch (error) {
    console.error('Erro ao buscar tarefas:', error)
    return res.status(500).json({ message: 'Erro ao buscar tarefas.' })
  }
}

export async function createTask(req, res) {
  try {
    const title = String(req.body.title || '').trim()

    if (!title) {
      return res.status(400).json({ message: 'Titulo da tarefa obrigatorio.' })
    }

    const newTask = await createTaskForUser(req.user.id, title)

    try {
      const ownerEmail = await getTaskOwnerEmail(req.user.id)

      if (ownerEmail) {
        await sendTaskCreatedEmail({
          to: ownerEmail,
          task: newTask
        })
      }
    } catch (emailError) {
      console.warn('Falha ao enviar email de criacao da tarefa:', emailError)
    }

    return res.status(201).json(newTask)
  } catch (error) {
    console.error('Erro ao criar tarefa:', error)
    return res.status(500).json({ message: 'Erro ao criar tarefa.' })
  }
}

export async function getSharedTasks(req, res) {
  try {
    const tasks = await listSharedTasksForUser(req.user.id)
    return res.status(200).json(tasks)
  } catch (error) {
    console.error('Erro ao buscar tarefas partilhadas:', error)
    return res.status(500).json({ message: 'Erro ao buscar tarefas partilhadas.' })
  }
}

export async function updateTask(req, res) {
  try {
    const taskId = parseTaskId(req.params.id)

    if (!taskId) {
      return res.status(400).json({ message: 'ID de tarefa invalido.' })
    }

    const ownerTask = await getTaskById(req.user.id, taskId)
    const sharedTask = ownerTask ? null : await getSharedTaskById(req.user.id, taskId)
    const currentTask = ownerTask || sharedTask
    const isOwner = Boolean(ownerTask)

    if (!currentTask) {
      return res.status(404).json({ message: 'Tarefa nao encontrada.' })
    }

    const hasTitle = Object.prototype.hasOwnProperty.call(req.body, 'title')
    const hasCompleted = Object.prototype.hasOwnProperty.call(req.body, 'completed')

    if (!isOwner && hasTitle) {
      return res.status(403).json({ message: 'Nao tens permissao para editar esta tarefa.' })
    }

    if (!isOwner && !hasCompleted) {
      return res.status(400).json({ message: 'Estado da tarefa obrigatorio.' })
    }

    const nextTitle = isOwner
      ? hasTitle
        ? String(req.body.title || '').trim()
        : currentTask.title
      : currentTask.title
    const nextCompleted = hasCompleted ? (req.body.completed ? 1 : 0) : currentTask.completed

    if (isOwner && !nextTitle) {
      return res.status(400).json({ message: 'Titulo da tarefa obrigatorio.' })
    }

    let updatedTask = null

    if (isOwner) {
      updatedTask = await updateTaskForUser(req.user.id, taskId, {
        title: nextTitle,
        completed: nextCompleted
      })
    } else {
      await updateTaskById(taskId, {
        title: currentTask.title,
        completed: nextCompleted
      })

      updatedTask = await getSharedTaskById(req.user.id, taskId)
    }

    if (!currentTask.completed && updatedTask.completed) {
      try {
        const ownerEmail = await getTaskOwnerEmail(isOwner ? req.user.id : currentTask.owner_id)

        if (ownerEmail) {
          await sendTaskCompletedEmail({
            to: ownerEmail,
            task: updatedTask,
            completedAt: new Date()
          })
        }
      } catch (emailError) {
        console.warn('Falha ao enviar email de conclusao da tarefa:', emailError)
      }
    }

    return res.status(200).json(updatedTask)
  } catch (error) {
    console.error('Erro ao atualizar tarefa:', error)
    return res.status(500).json({ message: 'Erro ao atualizar tarefa.' })
  }
}

export async function shareTask(req, res) {
  try {
    const taskId = parseTaskId(req.params.id)
    const identifier = String(req.body.identifier || '').trim()

    if (!taskId) {
      return res.status(400).json({ message: 'ID de tarefa invalido.' })
    }

    if (!identifier) {
      return res.status(400).json({ message: 'Email ou username obrigatorio.' })
    }

    const task = await getTaskById(req.user.id, taskId)

    if (!task) {
      return res.status(404).json({ message: 'Tarefa nao encontrada.' })
    }

    const targetUser = await getUserByIdentifier(identifier)

    if (!targetUser) {
      return res.status(404).json({ message: 'Utilizador de destino nao encontrado.' })
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({ message: 'Nao podes partilhar uma tarefa contigo mesmo.' })
    }

    const existingShare = await findTaskShare(taskId, targetUser.id)

    if (existingShare) {
      return res.status(409).json({ message: 'Esta tarefa ja foi partilhada com esse utilizador.' })
    }

    let taskShare = null

    try {
      taskShare = await createTaskShare({
        taskId,
        ownerId: req.user.id,
        sharedWithUserId: targetUser.id
      })
    } catch (error) {
      if (error?.code === 'ER_DUP_ENTRY' || error?.code === 'P2002') {
        return res
          .status(409)
          .json({ message: 'Esta tarefa ja foi partilhada com esse utilizador.' })
      }

      throw error
    }

    try {
      const owner = await getUserById(req.user.id)
      const sharedBy = owner?.username || owner?.email || req.user.username || req.user.email

      if (targetUser.email) {
        await sendTaskSharedEmail({
          to: targetUser.email,
          task,
          sharedBy,
          sharedAt: taskShare?.created_at || new Date()
        })
      }
    } catch (emailError) {
      console.warn('Falha ao enviar email de partilha da tarefa:', emailError)
    }

    const updatedTask = await getTaskById(req.user.id, taskId)

    return res.status(201).json({
      message: 'Tarefa partilhada com sucesso.',
      task: updatedTask,
      share: taskShare,
      sharedWith: {
        id: targetUser.id,
        username: targetUser.username,
        email: targetUser.email
      }
    })
  } catch (error) {
    console.error('Erro ao partilhar tarefa:', error)
    return res.status(500).json({ message: 'Erro ao partilhar tarefa.' })
  }
}

export async function deleteTask(req, res) {
  try {
    const taskId = parseTaskId(req.params.id)

    if (!taskId) {
      return res.status(400).json({ message: 'ID de tarefa invalido.' })
    }

    const deleted = await deleteTaskForUser(req.user.id, taskId)

    if (!deleted) {
      return res.status(404).json({ message: 'Tarefa nao encontrada.' })
    }

    return res.status(200).json({ message: 'Tarefa apagada com sucesso.' })
  } catch (error) {
    console.error('Erro ao apagar tarefa:', error)
    return res.status(500).json({ message: 'Erro ao apagar tarefa.' })
  }
}
