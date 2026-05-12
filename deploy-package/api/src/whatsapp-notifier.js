function twilioNotificationConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    contentSid: process.env.TWILIO_NOTIFICATION_CONTENT_SID,
    enabled: process.env.TWILIO_NOTIFICATIONS_ENABLED !== 'false',
  };
}

function basicAuth(accountSid, authToken) {
  return Buffer.from(`${accountSid}:${authToken}`).toString('base64');
}

function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';
  if (raw.startsWith('+')) return raw;

  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return '';
}

function requireWhatsAppAddress(value, label) {
  if (!/^whatsapp:\+\d{10,15}$/.test(String(value || ''))) {
    const error = new Error(`${label} must be in whatsapp:+14155238886 format`);
    error.status = 422;
    throw error;
  }
}

export async function sendWhatsAppNotification({ phone, title, message, variables }) {
  const config = twilioNotificationConfig();
  if (!config.enabled) {
    return { ok: false, skipped: true, reason: 'WhatsApp notifications disabled' };
  }

  if (!config.accountSid || !config.authToken || !config.from || !config.contentSid) {
    return { ok: false, skipped: true, reason: 'Twilio WhatsApp notification env vars missing' };
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return { ok: false, skipped: true, reason: 'User phone missing or invalid' };
  }

  const from = config.from;
  const to = `whatsapp:${normalizedPhone}`;
  requireWhatsAppAddress(from, 'Twilio WhatsApp sender');
  requireWhatsAppAddress(to, 'Recipient WhatsApp number');

  const contentVariables = JSON.stringify({
    1: title,
    2: message,
    ...(variables || {}),
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(config.accountSid, config.authToken)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: from,
      To: to,
      ContentSid: config.contentSid,
      ContentVariables: contentVariables,
    }),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(body.message || body.error_message || 'Twilio WhatsApp notification failed');
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return { ok: true, sid: body.sid, status: body.status || 'queued', to };
}
