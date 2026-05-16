import crypto from 'node:crypto';

export function isRazorpayConfigured(razorpayKeyId, razorpayKeySecret) {
  return Boolean(razorpayKeyId && razorpayKeySecret);
}

export function razorpayAuthHeader(razorpayKeyId, razorpayKeySecret) {
  return `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`;
}

export async function createRazorpayOrder(config, { paymentId, amount, user, transactionId, userReference }) {
  const { razorpayKeyId, razorpayKeySecret } = config;
  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      Authorization: razorpayAuthHeader(razorpayKeyId, razorpayKeySecret),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: Math.round(Number(amount || 0) * 100),
      currency: 'INR',
      receipt: `txn_${transactionId}`.slice(0, 40),
      notes: {
        user_id: String(userReference),
        payment_id: String(transactionId),
        transaction_id: String(transactionId),
        internal_payment_id: String(paymentId),
        email: String(user?.email || ''),
        phone: String(user?.phone || ''),
      },
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error?.description || payload?.error?.reason || 'Unable to create Razorpay order');
  }

  return payload;
}

export async function fetchRazorpayPayment(config, razorpayPaymentId) {
  const { razorpayKeyId, razorpayKeySecret } = config;
  if (!isRazorpayConfigured(razorpayKeyId, razorpayKeySecret) || !razorpayPaymentId) return null;
  const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(razorpayPaymentId)}`, {
    headers: {
      Authorization: razorpayAuthHeader(razorpayKeyId, razorpayKeySecret),
      Accept: 'application/json',
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.description || payload?.error?.reason || 'Unable to fetch Razorpay payment status');
  }
  return payload;
}

export function verifyRazorpaySignature(razorpayKeySecret, orderId, razorpayPaymentId, razorpaySignature) {
  const expected = crypto.createHmac('sha256', razorpayKeySecret).update(`${orderId}|${razorpayPaymentId}`).digest('hex');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(String(razorpaySignature || ''));
  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

export function normalizePaymentStatus(value) {
  const status = String(value || '').toLowerCase();
  if (status === 'success' || status === 'paid' || status === 'captured') return 'paid';
  if (status === 'authorized') return 'pending';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  if (status === 'failed') return 'failed';
  if (status === 'created') return 'created';
  return 'pending';
}

export function buildPaymentTransactionId(seedValue = Date.now()) {
  const digits = String(seedValue || Date.now()).replace(/\D/g, '') || String(Date.now());
  return digits.slice(-10).padStart(10, '0');
}

export function buildPaymentUserReference(userId) {
  return String(userId || '')
    .replace(/\D/g, '')
    .slice(-6)
    .padStart(6, '0');
}

export function appBaseUrlForRequest(req, fallbackBaseUrl) {
  const hostHeader = String(req.get('host') || '').trim();
  const hostname = hostHeader.split(':')[0];
  const isLocalhost = ['127.0.0.1', 'localhost', '::1'].includes(hostname);
  if (isLocalhost) return fallbackBaseUrl;

  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  return `${protocol}://${hostHeader}`.replace(/\/+$/, '');
}

export function buildPaymentsRedirect({ req, status, paymentId, appBaseUrl, extra = {} }) {
  const search = new URLSearchParams({
    paymentStatus: status,
    ...(paymentId ? { paymentId: String(paymentId) } : {}),
    ...Object.fromEntries(Object.entries(extra).filter(([, value]) => value !== undefined && value !== null && value !== '')),
  });
  return `${appBaseUrlForRequest(req, appBaseUrl)}/payments?${search.toString()}`;
}

export async function reconcilePaymentWithRazorpay(options) {
  const {
    payment,
    razorpayPaymentId,
    razorpayOrderId,
    razorpaySignature,
    fallbackStatus,
    store,
    persistStore,
    notifyUserMobile,
    razorpayKeyId,
    razorpayKeySecret,
  } = options;

  if (!payment) return { ok: false, error: 'Payment not found' };

  const paymentId = String(razorpayPaymentId || payment.razorpay_payment_id || '').trim();
  const orderId = String(razorpayOrderId || payment.razorpay_order_id || '').trim();
  const signature = String(razorpaySignature || payment.razorpay_signature || '').trim();

  if (payment.provider === 'razorpay' && payment.razorpay_order_id && orderId && payment.razorpay_order_id !== orderId) {
    payment.status = 'failed';
    payment.updated_at = new Date().toISOString();
    persistStore();
    return { ok: false, error: 'Razorpay order mismatch', payment };
  }

  if (
    signature &&
    paymentId &&
    payment.razorpay_order_id &&
    !verifyRazorpaySignature(razorpayKeySecret, payment.razorpay_order_id, paymentId, signature)
  ) {
    payment.status = 'failed';
    payment.razorpay_payment_id = paymentId;
    payment.updated_at = new Date().toISOString();
    persistStore();
    return { ok: false, error: 'Razorpay signature verification failed', payment };
  }

  let gatewayPayment = null;
  if (paymentId) {
    gatewayPayment = await fetchRazorpayPayment({ razorpayKeyId, razorpayKeySecret }, paymentId);
  }

  const gatewayStatus = normalizePaymentStatus(gatewayPayment?.status || fallbackStatus || payment.status);
  payment.status = gatewayStatus;
  payment.razorpay_payment_id = paymentId || payment.razorpay_payment_id;
  payment.razorpay_signature = signature || payment.razorpay_signature;
  payment.gateway_status = gatewayPayment?.status || payment.gateway_status || null;
  payment.gateway_method = gatewayPayment?.method || payment.gateway_method || null;
  payment.updated_at = new Date().toISOString();

  const user = store.users.find((item) => item.user_id === payment.payer_id);
  if (gatewayStatus === 'paid' && !payment.wallet_credited_at && user) {
    user.wallet_balance = Number(user.wallet_balance || 0) + Number(payment.amount || 0);
    payment.wallet_credited_at = new Date().toISOString();
    notifyUserMobile(payment.payer_id, 'Payment successful', `Payment of INR ${payment.amount} was completed.`);
  }

  persistStore();
  return { ok: gatewayStatus === 'paid', payment, walletBalance: Number(user?.wallet_balance || 0), gatewayPayment };
}
