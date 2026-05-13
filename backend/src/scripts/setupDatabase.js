import 'dotenv/config'
import { bootstrapDatabase } from '../config/databaseBootstrap.js'

async function run() {
  try {
    await bootstrapDatabase()
    console.log('Base de dados pronta a usar.')
  } catch (error) {
    console.error('Erro ao preparar a base de dados:', error)
    process.exit(1)
  }
}

void run()
