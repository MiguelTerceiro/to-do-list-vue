import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const parseDatabaseUrl = (value) => {
    if (!value) return null;

    try {
        const url = new URL(value);
        if (url.protocol !== 'mysql:') return null;

        return {
            host: url.hostname,
            port: url.port ? Number(url.port) : undefined,
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: url.pathname.replace(/^\//, ''),
        };
    } catch {
        return null;
    }
};

const fromUrl = parseDatabaseUrl(process.env.DATABASE_URL);
const config = {
    host: process.env.DB_HOST || fromUrl?.host || 'localhost',
    port: Number(process.env.DB_PORT || fromUrl?.port || 3306),
    user: process.env.DB_USER || fromUrl?.user || 'root',
    password: process.env.DB_PASSWORD || fromUrl?.password || '',
    database: process.env.DB_NAME || fromUrl?.database || 'todo_app',
    waitForConnections: true,
};

export const db = mysql.createPool({
    ...config,
});

db.getConnection()
    .then((conn) => {
        console.log('Base de dados ligada!');
        conn.release();
    })
    .catch((err) => {
        console.error('Erro ao ligar a base de dados:', err.code || err.message);
    });
