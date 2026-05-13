import { execFile } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { getDatabaseConfig } from './database.js'

const execFileAsync = promisify(execFile)

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const backendRoot = path.resolve(__dirname, '../..')
const prismaCliPath = path.resolve(backendRoot, 'node_modules/prisma/build/index.js')
const schemaPath = path.resolve(backendRoot, 'prisma/schema.prisma')
const tempSqlPath = path.resolve(backendRoot, '.tmp-create-database.sql')

function escapeMysqlIdentifier(identifier) {
  return identifier.replace(/`/g, '``')
}

function isNonEmptySchemaError(error) {
  return (
    error &&
    typeof error.stderr === 'string' &&
    error.stderr.includes('P3005')
  )
}

function isMigrationAlreadyAppliedError(error) {
  return (
    error &&
    typeof error.stderr === 'string' &&
    error.stderr.includes('P3008')
  )
}

async function getMigrationNames() {
  const migrationsDir = path.resolve(backendRoot, 'prisma/migrations')
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true })

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
}

async function runPrismaCommand(args) {
  const { stdout, stderr } = await execFileAsync(process.execPath, [prismaCliPath, ...args], {
    cwd: backendRoot,
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
    windowsHide: true
  })

  if (stdout.trim()) {
    console.log(stdout.trim())
  }

  if (stderr.trim()) {
    console.log(stderr.trim())
  }
}

export async function bootstrapDatabase() {
  const { adminUrl, databaseName } = getDatabaseConfig()

  if (!databaseName) {
    throw new Error('Nome da base de dados nao configurado.')
  }

  const sql = `CREATE DATABASE IF NOT EXISTS \`${escapeMysqlIdentifier(
    databaseName
  )}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

  await fs.writeFile(tempSqlPath, sql, 'utf8')

  try {
    console.log(`A garantir que a base de dados "${databaseName}" existe...`)
    await runPrismaCommand(['db', 'execute', '--file', tempSqlPath, '--url', adminUrl])

    console.log('A aplicar migrations pendentes...')
    try {
      await runPrismaCommand(['migrate', 'deploy', '--schema', schemaPath])
    } catch (error) {
      if (!isNonEmptySchemaError(error)) {
        throw error
      }

      const migrationNames = await getMigrationNames()

      if (migrationNames.length !== 1) {
        throw error
      }

      console.log(
        'A base ja tinha tabelas. Vou registar a migration inicial como aplicada e continuar.'
      )
      try {
        await runPrismaCommand([
          'migrate',
          'resolve',
          '--applied',
          migrationNames[0],
          '--schema',
          schemaPath
        ])
      } catch (resolveError) {
        if (!isMigrationAlreadyAppliedError(resolveError)) {
          throw resolveError
        }

        console.log('A migration inicial ja estava registada como aplicada.')
      }

      console.log('A verificar novamente se existem migrations por aplicar...')
      await runPrismaCommand(['migrate', 'deploy', '--schema', schemaPath])
    }
  } finally {
    await fs.rm(tempSqlPath, { force: true })
  }
}
