import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const hasMailConfig = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const createTransporter = () => {
    if (!hasMailConfig()) return null;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

export const sendMail = async ({ to, subject, text, html, replyTo }) => {
    const transporter = createTransporter();

    if (!transporter) {
        console.log(`Email nao enviado (SMTP por configurar): ${subject} -> ${to}`);
        return false;
    }

    await transporter.sendMail({
        from: process.env.SMTP_FROM || `"To-do List" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html,
        replyTo,
    });

    return true;
};
