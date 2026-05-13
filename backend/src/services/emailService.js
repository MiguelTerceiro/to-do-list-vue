import nodemailer from 'nodemailer'

function getSmtpConfig() {
  const host = String(process.env.SMTP_HOST || '').trim()
  const port = Number(process.env.SMTP_PORT)
  const user = String(process.env.SMTP_USER || '').trim()
  const pass = String(process.env.SMTP_PASS || '').trim()
  const from = String(process.env.SMTP_FROM || '').trim()

  if (!host || !port || !user || !pass || !from) {
    return null
  }

  return {
    host,
    port,
    user,
    pass,
    from
  }
}

let transporterPromise = null

async function getTransporter() {
  const smtpConfig = getSmtpConfig()

  if (!smtpConfig) {
    return null
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: smtpConfig.host,
        port: smtpConfig.port,
        secure: smtpConfig.port === 465,
        auth: {
          user: smtpConfig.user,
          pass: smtpConfig.pass
        }
      })
    )
  }

  return transporterPromise
}

function formatDateTime(dateValue) {
  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return date.toLocaleString('pt-PT', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

function formatTaskStatus(task) {
  return task.completed ? 'Concluida' : 'Pendente'
}

function buildTaskSummary(task, extraLines = []) {
  const lines = [
    `Titulo: ${task.title}`,
    task.description ? `Descricao: ${task.description}` : null,
    ...extraLines
  ].filter(Boolean)

  return lines.join('\n')
}

async function sendEmail({ to, subject, text }) {
  const smtpConfig = getSmtpConfig()

  if (!smtpConfig) {
    console.warn(
      `[email] Envio ignorado para ${to}: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS e SMTP_FROM nao estao configurados.`
    )

    return { delivered: false, skipped: true }
  }

  const transporter = await getTransporter()

  await transporter.sendMail({
    from: smtpConfig.from,
    to,
    subject,
    text
  })

  return { delivered: true, skipped: false }
}

export async function sendTaskCreatedEmail({ to, task }) {
  return sendEmail({
    to,
    subject: 'Nova tarefa criada',
    text: buildTaskSummary(task, [
      `Estado inicial: ${formatTaskStatus(task)}`,
      `Data de criacao: ${formatDateTime(task.created_at)}`
    ])
  })
}

export async function sendTaskCompletedEmail({ to, task, completedAt = new Date() }) {
  return sendEmail({
    to,
    subject: 'Tarefa concluida',
    text: buildTaskSummary(task, [`Data de conclusao: ${formatDateTime(completedAt)}`])
  })
}

export async function sendTaskSharedEmail({
  to,
  task,
  sharedBy,
  sharedAt = new Date()
}) {
  return sendEmail({
    to,
    subject: 'Uma tarefa foi partilhada contigo',
    text: buildTaskSummary(task, [
      `Partilhada por: ${sharedBy}`,
      `Data da partilha: ${formatDateTime(sharedAt)}`
    ])
  })
}
