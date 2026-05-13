function buildUrlFromParts({ host, port, user, password, database }) {
  const credentials = password
    ? `${encodeURIComponent(user)}:${encodeURIComponent(password)}`
    : encodeURIComponent(user)

  const databasePath = database ? `/${encodeURIComponent(database)}` : '/'

  return `mysql://${credentials}@${host}:${port}${databasePath}`
}

function normalizeDirectDatabaseUrl(directUrl) {
  const parsedUrl = new URL(directUrl)
  const databaseName = decodeURIComponent(parsedUrl.pathname.replace(/^\/+/, '')).trim()
  const adminUrl = new URL(parsedUrl.toString())

  adminUrl.pathname = '/'

  return {
    adminUrl: adminUrl.toString(),
    databaseName,
    runtimeUrl: parsedUrl.toString()
  }
}

export function getDatabaseConfig() {
  const directUrl = String(process.env.DATABASE_URL || '').trim()

  if (directUrl) {
    return normalizeDirectDatabaseUrl(directUrl)
  }

  const host = String(process.env.DB_HOST || 'localhost').trim()
  const port = String(process.env.DB_PORT || '3306').trim()
  const user = String(process.env.DB_USER || 'root').trim()
  const password = String(process.env.DB_PASSWORD || 'Ttavare$2k26')
  const databaseName = String(process.env.DB_NAME || 'todo_app').trim()

  return {
    adminUrl: buildUrlFromParts({ host, port, user, password, database: '' }),
    databaseName,
    runtimeUrl: buildUrlFromParts({ host, port, user, password, database: databaseName })
  }
}
