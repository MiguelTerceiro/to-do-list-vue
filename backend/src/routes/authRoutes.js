import { Router } from 'express'
import { getAuthConfig, googleLogin, login, register } from '../controllers/authController.js'

const router = Router()

router.get('/config', getAuthConfig)
router.post('/google', googleLogin)
router.post('/register', register)
router.post('/login', login)

export default router
