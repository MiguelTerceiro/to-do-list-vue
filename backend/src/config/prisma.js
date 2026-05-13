import { PrismaClient } from '@prisma/client'

function buildDatabaseUrl() {
  const directUrl = String(process.env.DATABASE_URL || '').trim()

  if (directUrl) {
    return directUrl
  }

  const host = String(process.env.DB_HOST || 'localhost').trim()
  const port = String(process.env.DB_PORT || '3306').trim()
  const user = String(process.env.DB_USER || 'root').trim()
  const password = String(process.env.DB_PASSWORD || 'Ttavare$2k26')
  const database = String(process.env.DB_NAME || 'todo_app').trim()

  const credentials = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user)

  return `mysql://${credentials}@${host}:${port}/${database}`
}

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.__todoPrisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: buildDatabaseUrl()
      }
    }
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__todoPrisma = prisma
}
