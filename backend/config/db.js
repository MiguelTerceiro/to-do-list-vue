import mysql from 'mysql2/promise';

export const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '3684',
    database: 'todo_app',
    waitForConnections: true,
});

db.getConnection()
    .then((conn) => {
        console.log('Base de dados ligada!');
        conn.release();
    })
    .catch((err) => {
        console.error('Erro ao ligar à base de dados:', err.code);
    });