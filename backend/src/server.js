import 'dotenv/config'
import { app } from './app.js'
import { prisma } from './config/prisma.js'

const PORT = Number(process.env.PORT) || 3000

let server = null

async function shutdown(signal) {
  console.log(`A encerrar servidor (${signal})...`)

  if (server) {
    await new Promise((resolve) => {
      server.close(() => resolve())
    })
  }

  await prisma.$disconnect()
  process.exit(0)
}

async function startServer() {
  try {
    await prisma.$connect()
    console.log('Base de dados ligada com Prisma')

    server = app.listen(PORT, () => {
      console.log(`Servidor a correr em http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Erro ao ligar a base de dados:', error)
    process.exit(1)
  }
}

process.once('SIGINT', () => {
  void shutdown('SIGINT')
})

process.once('SIGTERM', () => {
  void shutdown('SIGTERM')
})

void startServer()
