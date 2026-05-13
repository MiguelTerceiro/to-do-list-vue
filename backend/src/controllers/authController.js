import {
  authenticateUser,
  authenticateWithGoogle,
  createUser,
  findExistingUser
} from '../services/authService.js'

export function getAuthConfig(_req, res) {
  const googleClientId = String(process.env.GOOGLE_CLIENT_ID || '').trim()

  return res.status(200).json({
    googleClientId,
    googleLoginEnabled: Boolean(googleClientId)
  })
}

export async function register(req, res) {
  try {
    const username = String(req.body.username || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Preenche todos os campos.' })
    }

    const existingUser = await findExistingUser(email, username)

    if (existingUser) {
      return res.status(409).json({ message: 'Este email ou username ja esta registado.' })
    }

    await createUser({ username, email, password })

    return res.status(201).json({ message: 'Utilizador registado com sucesso.' })
  } catch (error) {
    console.error('Erro no registo:', error)
    return res.status(500).json({ message: 'Erro no servidor.' })
  }
}

export async function login(req, res) {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Preenche email e password.' })
    }

    const session = await authenticateUser(email, password)

    if (!session) {
      return res.status(401).json({ message: 'Email ou password invalidos.' })
    }

    return res.status(200).json(session)
  } catch (error) {
    console.error('Erro no login:', error)
    return res.status(500).json({ message: 'Erro no servidor.' })
  }
}

export async function googleLogin(req, res) {
  try {
    const credential = String(req.body.credential || '')

    if (!credential) {
      return res.status(400).json({ message: 'Credencial Google nao recebida.' })
    }

    const session = await authenticateWithGoogle(credential)

    if (!session) {
      return res.status(401).json({ message: 'Login Google invalido.' })
    }

    return res.status(200).json(session)
  } catch (error) {
    console.error('Erro no login Google:', error)
    return res.status(500).json({ message: 'Erro no servidor.' })
  }
}
