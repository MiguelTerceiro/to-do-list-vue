import { prisma } from '../config/prisma.js'

function getShareDisplayName(user) {
  const username = String(user?.username || '').trim()
  return username || user?.email || ''
}

function mapOwnedTask(task) {
  const sharedNames = task.shares
    .map((share) => getShareDisplayName(share.sharedWithUser))
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'pt'))

  return {
    id: task.id,
    title: task.title,
    completed: task.completed,
    created_at: task.createdAt,
    share_count: task.shares.length,
    shared_with_summary: sharedNames.join(', ')
  }
}

function mapSharedTask(share) {
  return {
    id: share.task.id,
    title: share.task.title,
    completed: share.task.completed,
    created_at: share.task.createdAt,
    shared_at: share.createdAt,
    owner_id: share.owner.id,
    owner_username: share.owner.username,
    owner_email: share.owner.email
  }
}

function mapTaskShare(share) {
  return {
    id: share.id,
    task_id: share.taskId,
    owner_id: share.ownerId,
    shared_with_user_id: share.sharedWithUserId,
    created_at: share.createdAt
  }
}

async function loadOwnedTask(userId, taskId) {
  return prisma.task.findFirst({
    where: {
      id: Number(taskId),
      userId: Number(userId)
    },
    include: {
      shares: {
        select: {
          id: true,
          sharedWithUser: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }
    }
  })
}

async function loadSharedTaskShare(userId, taskId) {
  return prisma.taskShare.findFirst({
    where: {
      sharedWithUserId: Number(userId),
      taskId: Number(taskId)
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          completed: true,
          createdAt: true
        }
      },
      owner: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    }
  })
}

export async function listUserTasks(userId) {
  const tasks = await prisma.task.findMany({
    where: {
      userId: Number(userId)
    },
    include: {
      shares: {
        select: {
          id: true,
          sharedWithUser: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }
    },
    orderBy: {
      id: 'desc'
    }
  })

  return tasks.map(mapOwnedTask)
}

export async function createTaskForUser(userId, title) {
  const task = await prisma.task.create({
    data: {
      userId: Number(userId),
      title,
      completed: false
    },
    include: {
      shares: {
        select: {
          id: true,
          sharedWithUser: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }
    }
  })

  return mapOwnedTask(task)
}

export async function getTaskById(userId, taskId) {
  const task = await loadOwnedTask(userId, taskId)
  return task ? mapOwnedTask(task) : null
}

export async function updateTaskForUser(userId, taskId, { title, completed }) {
  await prisma.task.updateMany({
    where: {
      id: Number(taskId),
      userId: Number(userId)
    },
    data: {
      title,
      completed: Boolean(completed)
    }
  })

  return getTaskById(userId, taskId)
}

export async function deleteTaskForUser(userId, taskId) {
  const result = await prisma.task.deleteMany({
    where: {
      id: Number(taskId),
      userId: Number(userId)
    }
  })

  return result.count > 0
}

export async function listSharedTasksForUser(userId) {
  const shares = await prisma.taskShare.findMany({
    where: {
      sharedWithUserId: Number(userId)
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
          completed: true,
          createdAt: true
        }
      },
      owner: {
        select: {
          id: true,
          username: true,
          email: true
        }
      }
    },
    orderBy: [{ createdAt: 'desc' }, { taskId: 'desc' }]
  })

  return shares.map(mapSharedTask)
}

export async function getSharedTaskById(userId, taskId) {
  const share = await loadSharedTaskShare(userId, taskId)
  return share ? mapSharedTask(share) : null
}

export async function findTaskShare(taskId, sharedWithUserId) {
  const share = await prisma.taskShare.findUnique({
    where: {
      taskId_sharedWithUserId: {
        taskId: Number(taskId),
        sharedWithUserId: Number(sharedWithUserId)
      }
    }
  })

  return share ? mapTaskShare(share) : null
}

export async function createTaskShare({ taskId, ownerId, sharedWithUserId }) {
  const share = await prisma.taskShare.create({
    data: {
      taskId: Number(taskId),
      ownerId: Number(ownerId),
      sharedWithUserId: Number(sharedWithUserId)
    }
  })

  return mapTaskShare(share)
}

export async function updateTaskById(taskId, { title, completed }) {
  await prisma.task.update({
    where: {
      id: Number(taskId)
    },
    data: {
      title,
      completed: Boolean(completed)
    }
  })
}
