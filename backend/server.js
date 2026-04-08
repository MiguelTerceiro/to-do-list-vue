import express from 'express';
import { db } from './config/db.js';

const app = express();


app.use(express.json()); // para receber JSON nos pedidos
app.use(express.static('../')); // para servir o teu index.html

app.listen(3000);