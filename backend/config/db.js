import mysql from 'mysql2/promise';

export const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '3684',    
    database: 'todo_app', 
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then((conn) => {
        console.log('base de dados ligada');
        conn.release();
    })
    .catch((err) => {
        console.error('erro ao ligar à base de dados', err.code);
    });
