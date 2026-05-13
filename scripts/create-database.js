import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('DATABASE_URL is missing. Create a .env file from .env.example first.');
    process.exit(1);
}

let url;

try {
    url = new URL(databaseUrl);
} catch {
    console.error('DATABASE_URL is invalid.');
    process.exit(1);
}

if (url.protocol !== 'mysql:') {
    console.error('DATABASE_URL must use the mysql:// protocol.');
    process.exit(1);
}

const database = decodeURIComponent(url.pathname.replace(/^\//, ''));

if (!database) {
    console.error('DATABASE_URL must include a database name, for example /todo_app.');
    process.exit(1);
}

const escapeIdentifier = (value) => `\`${value.replace(/`/g, '``')}\``;

const connection = await mysql.createConnection({
    host: url.hostname || 'localhost',
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
});

try {
    await connection.query(
        `CREATE DATABASE IF NOT EXISTS ${escapeIdentifier(database)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`Database ready: ${database}`);
} finally {
    await connection.end();
}
