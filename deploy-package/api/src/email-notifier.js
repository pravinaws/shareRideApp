import nodemailer from 'nodemailer';

function emailConfig() {
  return {
    enabled: process.env.EMAIL_NOTIFICATIONS_ENABLED !== 'false',
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
  };
}

function hasEmailConfig(config) {
  return Boolean(config.host && config.user && config.pass && config.from);
}

function htmlEscape(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export async function sendEmailNotification({ to, subject, message }) {
  const config = emailConfig();
  const recipient = String(to || '').trim();

  if (!config.enabled) {
    return { ok: false, skipped: true, reason: 'Email notifications disabled' };
  }

  if (!recipient || !recipient.includes('@')) {
    return { ok: false, skipped: true, reason: 'Recipient email missing or invalid' };
  }

  if (!hasEmailConfig(config)) {
    return { ok: false, skipped: true, reason: 'SMTP env vars missing' };
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });

  const info = await transporter.sendMail({
    from: config.from,
    to: recipient,
    subject,
    text: message,
    html: `<p>${htmlEscape(message).replaceAll('\n', '<br>')}</p>`,
  });

  return { ok: true, messageId: info.messageId };
}
