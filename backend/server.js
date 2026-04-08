import express from 'express';
import { db } from './config/db.js';

const app = express();

app.use(express.json());
app.use(express.static('../'));

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

// PUT - atualizar tarefa (texto ou concluida)
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

app.listen(3000, () => console.log('Servidor a correr em http://localhost:3000'));0e3
