import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { fileURLToPath } from 'url'
import authRoutes from './routes/authRoutes.js'
import taskRoutes from './routes/taskRoutes.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist')
const frontendIndexPath = path.join(frontendDistPath, 'index.html')
const hasBuiltFrontend = fs.existsSync(frontendIndexPath)

export const app = express()

app.use(express.json())
app.use('/api/auth', authRoutes)
app.use('/api/tasks', taskRoutes)

if (hasBuiltFrontend) {
  app.use(express.static(frontendDistPath))
}

app.get('/', (_req, res) => {
  if (!hasBuiltFrontend) {
    return res
      .status(200)
      .type('text/plain')
      .send(
        'Frontend Vite pronto para desenvolvimento. Usa "npm run dev" dentro de "frontend" e "npm run dev" dentro de "backend".'
      )
  }

  return res.sendFile(frontendIndexPath)
})
