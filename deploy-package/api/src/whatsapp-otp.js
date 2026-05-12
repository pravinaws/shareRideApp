import { randomInt } from 'node:crypto';

const otpSessions = new Map();
const otpTtlMs = Number(process.env.OTP_TTL_SECONDS || 600) * 1000;

function twilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    serviceSid: process.env.TWILIO_VERIFY_SERVICE_SID,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    contentSid: process.env.TWILIO_CONTENT_SID,
    contentVariables: process.env.TWILIO_CONTENT_VARIABLES,
    channel: process.env.TWILIO_VERIFY_CHANNEL || 'whatsapp',
    mode: process.env.TWILIO_OTP_MODE || 'messages',
    mock: process.env.TWILIO_MOCK_OTP === 'true',
  };
}

export function normalizePhone(phone) {
  const raw = String(phone || '').trim();
  if (!raw) return '';

  const digits = raw.replace(/\D/g, '');
  if (/^\d{10}$/.test(raw)) return `+91${raw}`;
  if (digits.startsWith('91') && digits.length === 12) return `+${digits}`;
  return '';
}

function localOtpFor(phone) {
  const otp = String(randomInt(100000, 999999));
  otpSessions.set(phone, {
    otp,
    expiresAt: Date.now() + otpTtlMs,
    attempts: 0,
  });
  return otp;
}

function basicAuth(accountSid, authToken) {
  return Buffer.from(`${accountSid}:${authToken}`).toString('base64');
}

function requireWhatsAppAddress(value, label) {
  if (!/^whatsapp:\+\d{10,15}$/.test(String(value || ''))) {
    const error = new Error(`${label} must be in whatsapp:+14155238886 format`);
    error.status = 422;
    throw error;
  }
}

function buildContentVariables(template, otp) {
  if (!template) return '';
  return template
    .replaceAll('{{otp}}', otp)
    .replaceAll('{{expiry}}', String(Math.round(otpTtlMs / 60000)));
}

async function twilioVerifyRequest(path, params) {
  const { accountSid, authToken } = twilioConfig();
  const response = await fetch(`https://verify.twilio.com/v2${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(accountSid, authToken)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = body.message || body.error_message || 'Twilio Verify request failed';
    const error = new Error(message);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return body;
}

async function twilioMessageRequest(accountSid, authToken, params) {
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basicAuth(accountSid, authToken)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const rawMessage = body.message || body.error_message || 'Twilio WhatsApp message request failed';
    const message = rawMessage.includes('Channel with the specified From address')
      ? `${rawMessage}. Check that WhatsApp Sandbox is enabled for this Account SID, the phone joined the sandbox, and TWILIO_WHATSAPP_NUMBER exactly matches the sandbox sender.`
      : rawMessage;
    const error = new Error(message);
    error.status = response.status;
    error.details = body;
    throw error;
  }

  return body;
}

export async function sendWhatsAppOtp(phone) {
  const normalizedPhone = normalizePhone(phone);
  const config = twilioConfig();

  if (!normalizedPhone) {
    const error = new Error('Enter a valid 10 digit numeric mobile number');
    error.status = 422;
    throw error;
  }

  if (
    config.mock ||
    !config.accountSid ||
    !config.authToken ||
    (config.mode === 'verify' && !config.serviceSid) ||
    (config.mode !== 'verify' && !config.whatsappNumber)
  ) {
    const demoOtp = localOtpFor(normalizedPhone);
    return {
      mode: 'local',
      phone: normalizedPhone,
      status: 'pending',
      demoOtp,
      message: 'Local OTP generated and saved in memory. Configure Twilio Verify env vars for WhatsApp delivery.',
    };
  }

  if (config.mode === 'verify') {
    const verification = await twilioVerifyRequest(`/Services/${config.serviceSid}/Verifications`, {
      To: normalizedPhone,
      Channel: config.channel,
    });

    return {
      mode: 'twilio_verify',
      phone: normalizedPhone,
      sid: verification.sid,
      status: verification.status,
      channel: verification.channel || config.channel,
      message: 'WhatsApp OTP sent using Twilio Verify',
    };
  }

  const from = config.whatsappNumber;
  const to = `whatsapp:${normalizedPhone}`;
  requireWhatsAppAddress(from, 'Twilio WhatsApp sender');
  requireWhatsAppAddress(to, 'Recipient WhatsApp number');

  const otp = localOtpFor(normalizedPhone);
  console.log(`Sending WhatsApp OTP using Twilio From=${from} To=${to}`);
  const messagePayload = config.contentSid
    ? {
        From: from,
        To: to,
        ContentSid: config.contentSid,
        ContentVariables: buildContentVariables(config.contentVariables || '{"1":"{{otp}}","2":"{{expiry}}"}', otp),
      }
    : {
        From: from,
        To: to,
        Body: `Your RideShare OTP is: ${otp}. It expires in ${Math.round(otpTtlMs / 60000)} minutes.`,
      };

  const message = await twilioMessageRequest(config.accountSid, config.authToken, {
    ...messagePayload,
  });

  return {
    mode: 'twilio_messages',
    phone: normalizedPhone,
    sid: message.sid,
    status: message.status || 'queued',
    channel: 'whatsapp',
    message: 'WhatsApp OTP sent using Twilio Sandbox',
    demoOtp: process.env.NODE_ENV === 'production' ? undefined : otp,
  };
}

async function verifyWithTwilioVerify(config, normalizedPhone, code) {
  const check = await twilioVerifyRequest(`/Services/${config.serviceSid}/VerificationCheck`, {
    To: normalizedPhone,
    Code: code,
  });

  return {
    ok: check.status === 'approved',
    status: check.status,
    mode: 'twilio_verify',
    sid: check.sid,
    channel: check.channel || config.channel,
  };
}

export async function verifyWhatsAppOtp(phone, otp) {
  const normalizedPhone = normalizePhone(phone);
  const code = String(otp || '').trim();
  const config = twilioConfig();

  if (!normalizedPhone || code.length < 4) {
    return { ok: false, status: 'invalid', message: 'Enter a valid 10 digit mobile number and OTP' };
  }

  if (!config.mock && config.mode === 'verify' && config.accountSid && config.authToken && config.serviceSid) {
    return verifyWithTwilioVerify(config, normalizedPhone, code);
  }

  {
    const session = otpSessions.get(normalizedPhone);
    if (!session) return { ok: false, status: 'missing', message: 'Request a new OTP' };
    if (Date.now() > session.expiresAt) {
      otpSessions.delete(normalizedPhone);
      return { ok: false, status: 'expired', message: 'OTP expired. Request a new OTP' };
    }

    session.attempts += 1;
    if (session.attempts > 5) {
      otpSessions.delete(normalizedPhone);
      return { ok: false, status: 'max_attempts', message: 'Too many attempts. Request a new OTP' };
    }

    if (session.otp !== code) {
      return { ok: false, status: 'pending', message: 'Incorrect OTP' };
    }

    otpSessions.delete(normalizedPhone);
    return { ok: true, status: 'approved', mode: config.mode === 'messages' ? 'twilio_messages' : 'local' };
  }
}
