import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'
import { prisma } from '../config/prisma.js'

const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_123'

const GOOGLE_CLIENT_ID = String(process.env.GOOGLE_CLIENT_ID || '').trim()

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID)

export async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: Number(userId) },
    select: {
      id: true,
      username: true,
      email: true
    }
  })
}

export async function getUserByIdentifier(identifier) {
  const normalizedIdentifier = String(identifier || '').trim()

  if (!normalizedIdentifier) {
    return null
  }

  return prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedIdentifier }, { username: normalizedIdentifier }]
    },
    select: {
      id: true,
      username: true,
      email: true
    }
  })
}

export async function findExistingUser(email, username) {
  return prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }]
    },
    select: {
      id: true
    }
  })
}

export async function createUser({ username, email, password }) {
  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      authProvider: 'local'
    }
  })
}

export async function authenticateUser(email, password) {
  const user = await prisma.user.findUnique({
    where: { email }
  })

  if (!user) {
    return null
  }

  if (!user.passwordHash) {
    return null
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash)

  if (!passwordOk) {
    return null
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return {
    message: 'Login feito com sucesso.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider
    }
  }
}

export async function authenticateWithGoogle(credential) {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error('GOOGLE_CLIENT_ID nao configurado.')
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: GOOGLE_CLIENT_ID
  })

  const payload = ticket.getPayload()

  if (!payload || !payload.sub || !payload.email || !payload.email_verified) {
    return null
  }

  const googleId = payload.sub
  const email = String(payload.email).trim().toLowerCase()
  const username = payload.name || email.split('@')[0]
  const avatarUrl = payload.picture || null

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId }, { email }]
    }
  })

  if (user) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId,
        avatarUrl,
        authProvider: user.passwordHash ? 'local_google' : 'google'
      }
    })
  } else {
    user = await prisma.user.create({
      data: {
        username,
        email,
        googleId,
        authProvider: 'google',
        avatarUrl
      }
    })
  }

  const token = jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )

  return {
    message: 'Login com Google feito com sucesso.',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      authProvider: user.authProvider
    }
  }
}
