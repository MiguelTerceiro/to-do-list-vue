import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './config/db.js';
 
const app = express();
const JWT_SECRET = 'chave_super_secreta_123'; /*a minha primeira chave para o user */
 
app.use(express.json());
app.use(express.static('../'));
 
app.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
 
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Preenche todos os campos.' });
    }
 
    const [existingUsers] = await db.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
 
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Este email já está registado.' });
    }
 
    const password_hash = await bcrypt.hash(password, 10);
 
    await db.query(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );
 
    res.status(201).json({ message: 'Utilizador registado com sucesso.' });
  } catch (error) {
    console.error('Erro no registo:', error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});
 
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
 
    if (!email || !password) {
      return res.status(400).json({ message: 'Preenche email e password.' });
    }
 
    const [users] = await db.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
 
    if (users.length === 0) {
      return res.status(401).json({ message: 'Email ou password inválidos.' });
    }
 
    const user = users[0];
 
    const passwordOk = await bcrypt.compare(password, user.password_hash);
 
    if (!passwordOk) {
      return res.status(401).json({ message: 'Email ou password inválidos.' });
    }
 
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
 
    res.status(200).json({
      message: 'Login feito com sucesso.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro no servidor.' });
  }
});
 
app.listen(3000, () => {
  console.log('Servidor a correr em http://localhost:3000');
});