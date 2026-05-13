import { PrismaClient } from '@prisma/client'
import { getDatabaseConfig } from './database.js'

const globalForPrisma = globalThis
const { runtimeUrl } = getDatabaseConfig()

export const prisma =
  globalForPrisma.__todoPrisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: runtimeUrl
      }
    }
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__todoPrisma = prisma
}
