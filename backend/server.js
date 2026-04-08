import express from 'express';
import { db } from './config/db.js';
import bcrypt from 'bcrypt';

const app = express();

app.use(express.json());
app.use(express.static('../dist'));

// POST - registar utilizador
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
        return res.status(400).json({ erro: 'Campos em falta' });

    const password_hash = await bcrypt.hash(password, 10);
    try {
        await db.query(
            'INSERT INTO utilizadores (nome, email, password_hash) VALUES (?, ?, ?)',
            [username, email, password_hash]
        );
        res.json({ ok: true });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY')
            return res.status(400).json({ erro: 'Email já existe' });
        res.status(500).json({ erro: 'Erro ao registar' });
    }
});

// POST - login
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ erro: 'Campos em falta' });

    const [rows] = await db.query(
        'SELECT * FROM utilizadores WHERE nome = ?', [username]
    );
    if (rows.length === 0)
        return res.status(401).json({ erro: 'Utilizador não encontrado' });

    const valido = await bcrypt.compare(password, rows[0].password_hash);
    if (!valido)
        return res.status(401).json({ erro: 'Password incorreta' });

    res.json({ ok: true, utilizador_id: rows[0].id, nome: rows[0].nome });
});

// GET - buscar todas as tarefas
app.get('/api/tasks', async (req, res) => {
    const [rows] = await db.query('SELECT * FROM tarefas ORDER BY id DESC');
    res.json(rows);
});

// POST - criar tarefa
app.post('/api/tasks', async (req, res) => {
    const { texto, utilizador_id } = req.body;
    const [result] = await db.query(
        'INSERT INTO tarefas (utilizador_id, texto) VALUES (?, ?)',
        [utilizador_id ?? 1, texto]
    );
    res.json({ id: result.insertId, texto, concluida: 0 });
});

// PUT - atualizar tarefa
app.put('/api/tasks/:id', async (req, res) => {
    const { texto, concluida } = req.body;
    await db.query(
        'UPDATE tarefas SET texto = ?, concluida = ? WHERE id = ?',
        [texto, concluida, req.params.id]
    );
    res.json({ ok: true });
});

// DELETE - apagar tarefa
app.delete('/api/tasks/:id', async (req, res) => {
    await db.query('DELETE FROM tarefas WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
});

app.listen(3000, () => console.log('Servidor a correr em http://localhost:3000'));