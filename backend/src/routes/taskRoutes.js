import { Router } from 'express'
import {
  createTask,
  deleteTask,
  getSharedTasks,
  getTasks,
  shareTask,
  updateTask
} from '../controllers/taskController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)
router.get('/shared', getSharedTasks)
router.get('/', getTasks)
router.post('/', createTask)
router.post('/:id/share', shareTask)
router.put('/:id', updateTask)
router.delete('/:id', deleteTask)

export default router
