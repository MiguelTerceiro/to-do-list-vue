import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import express from 'express';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './config/db.js';
import { sendMail } from './services/email.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.example') });

const distPath = path.resolve(__dirname, '../dist');
const port = process.env.PORT || 3000;
const appUrl = process.env.APP_URL || `http://localhost:${port}`;
const googleRedirectPath = '/auth/google/callback';
const verificationCodeTtlMs = 10 * 60 * 1000;
const verificationMaxAttempts = 5;
const trustedLoginTtlMs = 30 * 24 * 60 * 60 * 1000;
const trustedLoginSecret = process.env.SESSION_SECRET || process.env.APP_SECRET || process.env.SMTP_PASS || 'dev-trusted-login-secret';
const pendingVerifications = new Map();

app.use(express.json());
app.use((req, res, next) => {
    if (req.path === '/' || req.path.endsWith('.html')) {
        res.set('Cache-Control', 'no-store');
    }

    next();
});
app.use(express.static(distPath));

const parsePositiveInt = (value) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed) || parsed <= 0) return null;
    return parsed;
};

const validateTaskText = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

const normalizeUsername = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim();
};

const normalizeEmail = (value) => {
    if (typeof value !== 'string') return '';
    return value.trim().toLowerCase();
};

const cleanupExpiredVerifications = () => {
    const now = Date.now();

    for (const [token, challenge] of pendingVerifications.entries()) {
        if (challenge.expiresAt <= now) {
            pendingVerifications.delete(token);
        }
    }
};

const hashVerificationCode = (code) =>
    crypto.createHash('sha256').update(code).digest('hex');

const generateVerificationCode = () =>
    crypto.randomInt(100000, 1000000).toString();

const maskEmail = (email) => {
    const [name = '', domain = ''] = email.split('@');
    if (!name || !domain) return email;

    return `${name.slice(0, 2)}${'*'.repeat(Math.max(name.length - 2, 2))}@${domain}`;
};

const createVerificationChallenge = ({ type, email, payload }) => {
    cleanupExpiredVerifications();

    const token = crypto.randomBytes(32).toString('hex');
    const code = generateVerificationCode();

    pendingVerifications.set(token, {
        type,
        email,
        payload,
        codeHash: hashVerificationCode(code),
        expiresAt: Date.now() + verificationCodeTtlMs,
        attempts: 0
    });

    return { token, code };
};

const findPendingVerificationByEmail = (type, email) => {
    cleanupExpiredVerifications();

    for (const [token, challenge] of pendingVerifications.entries()) {
        if (challenge.type === type && challenge.email === email) {
            return { token, challenge };
        }
    }

    return null;
};

const findVerificationChallenge = (token, type) => {
    cleanupExpiredVerifications();

    if (typeof token !== 'string' || !token) return null;

    const challenge = pendingVerifications.get(token);
    if (!challenge || challenge.type !== type || challenge.expiresAt <= Date.now()) {
        pendingVerifications.delete(token);
        return null;
    }

    return challenge;
};

const isVerificationCodeValid = (challenge, code) => {
    const normalizedCode = typeof code === 'string' ? code.trim() : '';
    if (!/^\d{6}$/.test(normalizedCode)) return false;

    const expected = Buffer.from(challenge.codeHash, 'hex');
    const received = Buffer.from(hashVerificationCode(normalizedCode), 'hex');

    return expected.length === received.length && crypto.timingSafeEqual(expected, received);
};

const sendVerificationCode = async ({ to, code, purpose }) => {
    const isRegister = purpose === 'register';
    const title = isRegister ? 'Codigo de verificacao do registo' : 'Codigo de verificacao do login';
    const intro = isRegister
        ? 'Usa este codigo para confirmar o teu email e criar a conta.'
        : 'Usa este codigo para concluir o login.';

    return sendMail({
        to,
        subject: title,
        text: `${intro}\n\nCodigo: ${code}\n\nEste codigo expira em 10 minutos.`,
        html: `
            <div style="margin:0;padding:24px;background:#07101d;font-family:Arial,sans-serif;color:#f7f0e5;">
                <div style="max-width:520px;margin:0 auto;padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#111f31;">
                    <p style="margin:0 0 10px;color:#ffcf70;font-size:12px;text-transform:uppercase;letter-spacing:.12em;">To-do List</p>
                    <h1 style="margin:0 0 12px;font-size:24px;color:#ffffff;">${escapeHtml(title)}</h1>
                    <p style="margin:0 0 18px;color:#d9e1eb;line-height:1.6;">${escapeHtml(intro)}</p>
                    <p style="margin:0;padding:18px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);font-size:32px;letter-spacing:.18em;text-align:center;color:#ffcf70;font-weight:700;">${escapeHtml(code)}</p>
                    <p style="margin:18px 0 0;color:#8fa3bb;font-size:13px;">Este codigo expira em 10 minutos.</p>
                </div>
            </div>
        `
    });
};

const handleInvalidVerification = (token, challenge) => {
    challenge.attempts += 1;

    if (challenge.attempts >= verificationMaxAttempts) {
        pendingVerifications.delete(token);
    }
};

const signTrustedPayload = (payload) =>
    crypto.createHmac('sha256', trustedLoginSecret).update(payload).digest('base64url');

const createTrustedLoginToken = (userId) => {
    const payload = Buffer.from(
        JSON.stringify({
            type: 'trusted-login',
            userId,
            exp: Date.now() + trustedLoginTtlMs
        })
    ).toString('base64url');

    return `${payload}.${signTrustedPayload(payload)}`;
};

const verifyTrustedLoginToken = (token, userId) => {
    if (typeof token !== 'string' || !token.includes('.')) return false;

    const [payload, signature] = token.split('.');
    if (!payload || !signature) return false;

    const expected = Buffer.from(signTrustedPayload(payload));
    const received = Buffer.from(signature);
    if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) {
        return false;
    }

    try {
        const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
        return data.type === 'trusted-login'
            && Number(data.userId) === Number(userId)
            && Number(data.exp) > Date.now();
    } catch {
        return false;
    }
};

const readUserId = (req) => parsePositiveInt(req.query.utilizador_id ?? req.body.utilizador_id);
const readTaskId = (req) => parsePositiveInt(req.params.id);
const readCompletedValue = (value) => (value ? 1 : 0);

const taskToResponse = (task) => {
    const isShared = Boolean(Number(task.is_shared || 0));

    return {
        id: task.id,
        text: task.texto,
        isDone: Boolean(task.concluida),
        createdAt: task.data_criacao,
        updatedAt: task.data_atualizacao,
        utilizador_id: task.utilizador_id,
        ownerName: task.owner_nome || null,
        ownerEmail: task.owner_email || null,
        isShared,
        canDelete: !isShared,
        canShare: !isShared
    };
};

const fetchTaskForUserById = async (taskId, userId) => {
    const [rows] = await db.query(
        `SELECT
            t.*,
            owner.nome AS owner_nome,
            owner.email AS owner_email,
            IF(t.utilizador_id = ?, 0, 1) AS is_shared
        FROM tarefas t
        JOIN utilizadores owner ON owner.id = t.utilizador_id
        LEFT JOIN tarefas_partilhas s
            ON s.tarefa_id = t.id
            AND s.shared_with_user_id = ?
        WHERE t.id = ?
            AND (t.utilizador_id = ? OR s.shared_with_user_id = ?)
        LIMIT 1`,
        [userId, userId, taskId, userId, userId]
    );

    return rows[0] || null;
};

const fetchOwnedTaskById = async (taskId, userId) => {
    const [rows] = await db.query(
        `SELECT
            t.*,
            owner.nome AS owner_nome,
            owner.email AS owner_email,
            0 AS is_shared
        FROM tarefas t
        JOIN utilizadores owner ON owner.id = t.utilizador_id
        WHERE t.id = ? AND t.utilizador_id = ?
        LIMIT 1`,
        [taskId, userId]
    );

    return rows[0] || null;
};

const authUserToResponse = (user) => ({
    ok: true,
    utilizador_id: user.id,
    nome: user.nome,
    email: user.email,
    avatar_url: user.avatar_url || null,
    auth_provider: user.auth_provider || 'local'
});

const fetchUserById = async (userId) => {
    const [rows] = await db.query(
        'SELECT id, nome, email FROM utilizadores WHERE id = ? LIMIT 1',
        [userId]
    );

    return rows[0] || null;
};

const fetchTaskParticipants = async (taskId) => {
    const [owners] = await db.query(
        `SELECT owner.id, owner.nome, owner.email
        FROM tarefas t
        JOIN utilizadores owner ON owner.id = t.utilizador_id
        WHERE t.id = ?
        LIMIT 1`,
        [taskId]
    );

    const [sharedUsers] = await db.query(
        `SELECT u.id, u.nome, u.email
        FROM tarefas_partilhas s
        JOIN utilizadores u ON u.id = s.shared_with_user_id
        WHERE s.tarefa_id = ?`,
        [taskId]
    );

    return [...owners, ...sharedUsers];
};

const escapeHtml = (value = '') =>
    String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

const getTaskLink = () => {
    try {
        return new URL('/index.html', appUrl).toString();
    } catch {
        return `http://localhost:${port}/index.html`;
    }
};

const getTaskStatusLabel = (task) => (Number(task.concluida) ? 'Concluida' : 'Pendente');

const buildTaskEmail = ({ title, intro, task, actorLabel }) => {
    const taskText = task.texto || task.text || '';
    const status = getTaskStatusLabel(task);
    const taskLink = getTaskLink();

    return {
        text: `${intro}\n\nTarefa: ${taskText}\nEstado: ${status}\n${actorLabel ? `Por: ${actorLabel}\n` : ''}\nAbrir lista: ${taskLink}`,
        html: `
            <div style="margin:0;padding:24px;background:#07101d;font-family:Arial,sans-serif;color:#f7f0e5;">
                <div style="max-width:560px;margin:0 auto;padding:24px;border:1px solid rgba(255,255,255,.12);border-radius:18px;background:#111f31;">
                    <p style="margin:0 0 10px;color:#ffcf70;font-size:12px;text-transform:uppercase;letter-spacing:.12em;">To-do List</p>
                    <h1 style="margin:0 0 14px;font-size:24px;line-height:1.2;color:#ffffff;">${escapeHtml(title)}</h1>
                    <p style="margin:0 0 18px;color:#d9e1eb;line-height:1.6;">${escapeHtml(intro)}</p>
                    <div style="padding:16px;border-radius:14px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);">
                        <p style="margin:0 0 10px;color:#ffffff;font-size:16px;line-height:1.5;">${escapeHtml(taskText)}</p>
                        <p style="margin:0;color:#8fa3bb;font-size:13px;">Estado: <strong style="color:#ffcf70;">${escapeHtml(status)}</strong></p>
                        ${actorLabel ? `<p style="margin:6px 0 0;color:#8fa3bb;font-size:13px;">Por: ${escapeHtml(actorLabel)}</p>` : ''}
                    </div>
                    <p style="margin:22px 0 0;">
                        <a href="${escapeHtml(taskLink)}" style="display:inline-block;padding:12px 16px;border-radius:12px;background:#ffcf70;color:#07101d;text-decoration:none;font-weight:700;">Abrir lista</a>
                    </p>
                </div>
            </div>
        `
    };
};

const notifyTaskShared = async ({ task, owner, targetUser }) => {
    try {
        const email = buildTaskEmail({
            title: 'Foi partilhada uma tarefa contigo',
            intro: `${owner.nome} partilhou uma tarefa contigo.`,
            task,
            actorLabel: owner.email || owner.nome
        });

        return await sendMail({
            to: targetUser.email,
            subject: 'Tarefa partilhada contigo',
            text: email.text,
            html: email.html,
            replyTo: owner.email || undefined
        });
    } catch (err) {
        console.error('Erro ao enviar email de partilha:', err.message);
        return false;
    }
};

const notifyTaskUpdated = async ({ task, actor }) => {
    try {
        const participants = await fetchTaskParticipants(task.id);
        const recipients = participants.filter((user) => user.id !== actor.id);
        if (recipients.length === 0) return { sent: 0, failed: 0, skipped: 0 };

        const email = buildTaskEmail({
            title: 'Uma tarefa partilhada foi alterada',
            intro: `${actor.nome} alterou uma tarefa partilhada.`,
            task,
            actorLabel: actor.email || actor.nome
        });

        const results = await Promise.allSettled(
            recipients.map((user) =>
                sendMail({
                    to: user.email,
                    subject: 'Tarefa partilhada alterada',
                    text: email.text,
                    html: email.html,
                    replyTo: actor.email || undefined
                })
            )
        );

        return results.reduce(
            (summary, result) => {
                if (result.status === 'fulfilled' && result.value === true) {
                    summary.sent += 1;
                } else if (result.status === 'fulfilled' && result.value === false) {
                    summary.skipped += 1;
                } else {
                    summary.failed += 1;
                }

                return summary;
            },
            { sent: 0, failed: 0, skipped: 0 }
        );
    } catch (err) {
        console.error('Erro ao enviar email de alteracao:', err.message);
        return { sent: 0, failed: 1, skipped: 0 };
    }
};

const getGoogleRedirectUri = () => new URL(googleRedirectPath, appUrl).toString();
const hasGoogleConfig = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

const redirectWithAuthError = (res, reason) => {
    res.redirect(`/login.html?auth_error=${encodeURIComponent(reason)}`);
};

const readCookie = (req, name) => {
    const cookies = req.headers.cookie?.split(';') || [];
    const cookie = cookies.find((item) => item.trim().startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.trim().slice(name.length + 1)) : null;
};

const fetchGoogleProfile = async (code) => {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: getGoogleRedirectUri(),
            grant_type: 'authorization_code'
        })
    });

    const tokenData = await tokenResponse.json().catch(() => null);
    if (!tokenResponse.ok || !tokenData?.access_token) {
        throw new Error('Erro ao autenticar com Google');
    }

    const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    const profile = await profileResponse.json().catch(() => null);
    if (!profileResponse.ok || !profile?.id || !profile?.email) {
        throw new Error('Perfil Google invalido');
    }

    return profile;
};

const findOrCreateGoogleUser = async (profile) => {
    const emailVerified = Boolean(profile.verified_email);
    const displayName = profile.name || profile.email.split('@')[0];
    const avatarUrl = profile.picture || null;

    const [googleRows] = await db.query(
        'SELECT * FROM utilizadores WHERE google_id = ? LIMIT 1',
        [profile.id]
    );

    if (googleRows[0]) {
        await db.query(
            'UPDATE utilizadores SET nome = ?, email = ?, avatar_url = ?, email_verificado = ? WHERE id = ?',
            [displayName, profile.email, avatarUrl, emailVerified, googleRows[0].id]
        );

        return {
            ...googleRows[0],
            nome: displayName,
            email: profile.email,
            avatar_url: avatarUrl,
            email_verificado: emailVerified
        };
    }

    const [emailRows] = await db.query(
        'SELECT * FROM utilizadores WHERE email = ? LIMIT 1',
        [profile.email]
    );

    if (emailRows[0]) {
        const provider = emailRows[0].password_hash ? emailRows[0].auth_provider : 'google';
        await db.query(
            'UPDATE utilizadores SET google_id = ?, auth_provider = ?, avatar_url = ?, email_verificado = ? WHERE id = ?',
            [profile.id, provider, avatarUrl, emailVerified, emailRows[0].id]
        );

        return {
            ...emailRows[0],
            google_id: profile.id,
            auth_provider: provider,
            avatar_url: avatarUrl,
            email_verificado: emailVerified
        };
    }

    const [result] = await db.query(
        'INSERT INTO utilizadores (nome, email, password_hash, google_id, auth_provider, avatar_url, email_verificado) VALUES (?, ?, NULL, ?, ?, ?, ?)',
        [displayName, profile.email, profile.id, 'google', avatarUrl, emailVerified]
    );

    return {
        id: result.insertId,
        nome: displayName,
        email: profile.email,
        google_id: profile.id,
        auth_provider: 'google',
        avatar_url: avatarUrl,
        email_verificado: emailVerified
    };
};

const sendGoogleLoginSuccess = (res, user) => {
    const userJson = JSON.stringify(authUserToResponse(user));

    res.type('html').send(`<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Login Google</title>
</head>
<body>
  <script>
    localStorage.setItem('user', ${JSON.stringify(userJson)});
    window.location.replace('/index.html');
  </script>
</body>
</html>`);
};

// GET - iniciar login Google
app.get('/auth/google', (req, res) => {
    if (!hasGoogleConfig()) {
        redirectWithAuthError(res, 'google_missing_config');
        return;
    }

    const state = crypto.randomBytes(24).toString('hex');
    res.cookie('google_oauth_state', state, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000
    });

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', process.env.GOOGLE_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', getGoogleRedirectUri());
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'openid email profile');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('prompt', 'select_account');

    res.redirect(authUrl.toString());
});

// GET - callback Google
app.get(googleRedirectPath, async (req, res) => {
    if (req.query.error) {
        redirectWithAuthError(res, 'google_denied');
        return;
    }

    if (!hasGoogleConfig()) {
        redirectWithAuthError(res, 'google_missing_config');
        return;
    }

    const code = typeof req.query.code === 'string' ? req.query.code : '';
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const storedState = readCookie(req, 'google_oauth_state');

    if (!code || !state || state !== storedState) {
        redirectWithAuthError(res, 'google_invalid_state');
        return;
    }

    res.clearCookie('google_oauth_state');

    try {
        const profile = await fetchGoogleProfile(code);
        const user = await findOrCreateGoogleUser(profile);
        sendGoogleLoginSuccess(res, user);
    } catch (err) {
        console.error('Erro no login Google:', err.message);
        redirectWithAuthError(res, 'google_failed');
    }
});

// POST - registar utilizador
app.post('/register', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ erro: 'Campos em falta' });
    }

    try {
        const [existingUsers] = await db.query(
            'SELECT id FROM utilizadores WHERE email = ? LIMIT 1',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ erro: 'Email ja existe' });
        }

        const pendingChallenge = findPendingVerificationByEmail('register', email);
        if (pendingChallenge) {
            return res.status(202).json({
                ok: true,
                verificationRequired: true,
                verificationToken: pendingChallenge.token,
                email: maskEmail(email)
            });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const challenge = createVerificationChallenge({
            type: 'register',
            email,
            payload: { username, email, password_hash }
        });

        const sent = await sendVerificationCode({
            to: email,
            code: challenge.code,
            purpose: 'register'
        });

        if (!sent) {
            pendingVerifications.delete(challenge.token);
            return res.status(500).json({ erro: 'Nao foi possivel enviar o codigo. Confirma o SMTP.' });
        }

        res.status(202).json({
            ok: true,
            verificationRequired: true,
            verificationToken: challenge.token,
            email: maskEmail(email)
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Email ja existe' });
        }

        res.status(500).json({ erro: 'Erro ao registar' });
    }
});

// POST - validar codigo de registo
app.post('/register/verify', async (req, res) => {
    const token = typeof req.body.verificationToken === 'string' ? req.body.verificationToken : '';
    const code = typeof req.body.code === 'string' ? req.body.code : '';
    const challenge = findVerificationChallenge(token, 'register');

    if (!challenge) {
        return res.status(400).json({ erro: 'Codigo expirado. Pede um novo codigo.' });
    }

    if (!isVerificationCodeValid(challenge, code)) {
        handleInvalidVerification(token, challenge);
        return res.status(400).json({ erro: 'Codigo invalido.' });
    }

    const { username, email, password_hash } = challenge.payload;

    try {
        await db.query(
            'INSERT INTO utilizadores (nome, email, password_hash, email_verificado) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, true]
        );

        pendingVerifications.delete(token);
        res.json({ ok: true });
    } catch (err) {
        pendingVerifications.delete(token);

        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ erro: 'Email ja existe' });
        }

        res.status(500).json({ erro: 'Erro ao confirmar registo' });
    }
});

// POST - login
app.post('/login', async (req, res) => {
    const username = normalizeUsername(req.body.username);
    const { password } = req.body;
    const trustedLoginToken = typeof req.body.trustedLoginToken === 'string'
        ? req.body.trustedLoginToken
        : '';

    if (!username || !password) {
        return res.status(400).json({ erro: 'Campos em falta' });
    }

    const [rows] = await db.query(
        'SELECT * FROM utilizadores WHERE nome = ?',
        [username]
    );

    if (rows.length === 0) {
        return res.status(401).json({ erro: 'Utilizador nao encontrado' });
    }

    if (!rows[0].password_hash) {
        return res.status(401).json({ erro: 'Esta conta usa login com Google' });
    }

    const valido = await bcrypt.compare(password, rows[0].password_hash);
    if (!valido) {
        return res.status(401).json({ erro: 'Password incorreta' });
    }

    if (verifyTrustedLoginToken(trustedLoginToken, rows[0].id)) {
        return res.json(authUserToResponse(rows[0]));
    }

    const pendingChallenge = findPendingVerificationByEmail('login', rows[0].email);
    if (pendingChallenge) {
        return res.status(202).json({
            ok: true,
            verificationRequired: true,
            verificationToken: pendingChallenge.token,
            email: maskEmail(rows[0].email)
        });
    }

    const challenge = createVerificationChallenge({
        type: 'login',
        email: rows[0].email,
        payload: { userId: rows[0].id }
    });

    const sent = await sendVerificationCode({
        to: rows[0].email,
        code: challenge.code,
        purpose: 'login'
    });

    if (!sent) {
        pendingVerifications.delete(challenge.token);
        return res.status(500).json({ erro: 'Nao foi possivel enviar o codigo. Confirma o SMTP.' });
    }

    res.status(202).json({
        ok: true,
        verificationRequired: true,
        verificationToken: challenge.token,
        email: maskEmail(rows[0].email)
    });
});

// POST - validar codigo de login
app.post('/login/verify', async (req, res) => {
    const token = typeof req.body.verificationToken === 'string' ? req.body.verificationToken : '';
    const code = typeof req.body.code === 'string' ? req.body.code : '';
    const rememberLogin = Boolean(req.body.rememberLogin);
    const challenge = findVerificationChallenge(token, 'login');

    if (!challenge) {
        return res.status(400).json({ erro: 'Codigo expirado. Faz login novamente.' });
    }

    if (!isVerificationCodeValid(challenge, code)) {
        handleInvalidVerification(token, challenge);
        return res.status(400).json({ erro: 'Codigo invalido.' });
    }

    try {
        const [rows] = await db.query(
            'SELECT * FROM utilizadores WHERE id = ? LIMIT 1',
            [challenge.payload.userId]
        );

        if (!rows[0]) {
            pendingVerifications.delete(token);
            return res.status(404).json({ erro: 'Utilizador nao encontrado' });
        }

        pendingVerifications.delete(token);
        res.json({
            ...authUserToResponse(rows[0]),
            trustedLoginToken: rememberLogin ? createTrustedLoginToken(rows[0].id) : null
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao validar login' });
    }
});

// GET - procurar utilizadores por email/nome para partilha
app.get('/api/users/search', async (req, res) => {
    const userId = readUserId(req);
    const query = typeof req.query.query === 'string' ? req.query.query.trim() : '';

    if (!userId) {
        return res.status(400).json({ erro: 'utilizador_id invalido' });
    }

    if (query.length < 2) {
        return res.json([]);
    }

    try {
        const [rows] = await db.query(
            `SELECT id, nome, email
            FROM utilizadores
            WHERE id <> ?
                AND (email LIKE ? OR nome LIKE ?)
            ORDER BY email ASC
            LIMIT 8`,
            [userId, `%${query}%`, `%${query}%`]
        );

        res.json(rows);
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao procurar utilizadores' });
    }
});

// GET - buscar tarefas do utilizador autenticado
app.get('/api/tasks', async (req, res) => {
    const userId = readUserId(req);
    if (!userId) {
        return res.status(400).json({ erro: 'utilizador_id invalido' });
    }

    try {
        const [rows] = await db.query(
            `SELECT
                t.*,
                owner.nome AS owner_nome,
                owner.email AS owner_email,
                IF(t.utilizador_id = ?, 0, 1) AS is_shared
            FROM tarefas t
            JOIN utilizadores owner ON owner.id = t.utilizador_id
            LEFT JOIN tarefas_partilhas s
                ON s.tarefa_id = t.id
                AND s.shared_with_user_id = ?
            WHERE t.utilizador_id = ? OR s.shared_with_user_id = ?
            ORDER BY t.data_criacao DESC, t.id DESC`,
            [userId, userId, userId, userId]
        );

        res.json(rows.map(taskToResponse));
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao carregar tarefas' });
    }
});

// POST - criar tarefa
app.post('/api/tasks', async (req, res) => {
    const userId = readUserId(req);
    const text = validateTaskText(req.body.texto);

    if (!userId) {
        return res.status(400).json({ erro: 'utilizador_id invalido' });
    }

    if (!text) {
        return res.status(400).json({ erro: 'Texto da tarefa em falta' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO tarefas (utilizador_id, texto) VALUES (?, ?)',
            [userId, text]
        );

        const createdTask = await fetchTaskForUserById(result.insertId, userId);
        res.status(201).json(taskToResponse(createdTask));
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao criar tarefa' });
    }
});

// POST - partilhar tarefa com outro utilizador
app.post('/api/tasks/:id/share', async (req, res) => {
    const userId = readUserId(req);
    const taskId = readTaskId(req);
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';

    if (!userId) {
        return res.status(400).json({ erro: 'utilizador_id invalido' });
    }

    if (!taskId) {
        return res.status(400).json({ erro: 'id da tarefa invalido' });
    }

    if (!email) {
        return res.status(400).json({ erro: 'Email do utilizador em falta' });
    }

    try {
        const task = await fetchOwnedTaskById(taskId, userId);
        if (!task) {
            return res.status(404).json({ erro: 'So o dono pode partilhar esta tarefa' });
        }

        const [users] = await db.query(
            'SELECT id, nome, email FROM utilizadores WHERE email = ? LIMIT 1',
            [email]
        );
        const targetUser = users[0];

        if (!targetUser) {
            return res.status(404).json({ erro: 'Utilizador nao encontrado com esse email' });
        }

        if (targetUser.id === userId) {
            return res.status(400).json({ erro: 'Nao podes partilhar uma tarefa contigo proprio' });
        }

        await db.query(
            `INSERT INTO tarefas_partilhas (tarefa_id, shared_with_user_id, shared_by_user_id)
            VALUES (?, ?, ?)
            ON DUPLICATE KEY UPDATE shared_by_user_id = VALUES(shared_by_user_id)`,
            [taskId, targetUser.id, userId]
        );

        const notificationSent = await notifyTaskShared({
            task,
            owner: {
                id: userId,
                nome: task.owner_nome || 'Utilizador',
                email: task.owner_email
            },
            targetUser
        });

        res.json({
            ok: true,
            notificationSent,
            sharedWith: {
                id: targetUser.id,
                nome: targetUser.nome,
                email: targetUser.email
            }
        });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao partilhar tarefa' });
    }
});

// PUT - atualizar tarefa
app.put('/api/tasks/:id', async (req, res) => {
    const userId = readUserId(req);
    const taskId = readTaskId(req);
    const text = validateTaskText(req.body.texto);

    if (!userId) {
        return res.status(400).json({ erro: 'utilizador_id invalido' });
    }

    if (!taskId) {
        return res.status(400).json({ erro: 'id da tarefa invalido' });
    }

    if (!text) {
        return res.status(400).json({ erro: 'Texto da tarefa em falta' });
    }

    try {
        const previousTask = await fetchTaskForUserById(taskId, userId);
        const completedValue = readCompletedValue(req.body.concluida);

        const [result] = await db.query(
            `UPDATE tarefas t
            SET t.texto = ?, t.concluida = ?
            WHERE t.id = ?
                AND (
                    t.utilizador_id = ?
                    OR EXISTS (
                        SELECT 1 FROM tarefas_partilhas s
                        WHERE s.tarefa_id = t.id
                            AND s.shared_with_user_id = ?
                    )
                )`,
            [text, completedValue, taskId, userId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Tarefa nao encontrada' });
        }

        const updatedTask = await fetchTaskForUserById(taskId, userId);
        const actor = await fetchUserById(userId);
        const taskChanged = previousTask
            && (previousTask.texto !== text || Number(previousTask.concluida) !== completedValue);

        if (taskChanged && actor) {
            await notifyTaskUpdated({
                task: updatedTask,
                actor
            });
        }

        res.json(taskToResponse(updatedTask));
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao atualizar tarefa' });
    }
});

// DELETE - apagar tarefa
app.delete('/api/tasks/:id', async (req, res) => {
    const userId = readUserId(req);
    const taskId = readTaskId(req);

    if (!userId) {
        return res.status(400).json({ erro: 'utilizador_id invalido' });
    }

    if (!taskId) {
        return res.status(400).json({ erro: 'id da tarefa invalido' });
    }

    try {
        const [result] = await db.query(
            'DELETE FROM tarefas WHERE id = ? AND utilizador_id = ?',
            [taskId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Tarefa nao encontrada' });
        }

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao apagar tarefa' });
    }
});

app.listen(port, () => console.log(`Servidor a correr em http://localhost:${port}`));
