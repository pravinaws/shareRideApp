import fs from 'node:fs';
import crypto from 'node:crypto';
import apn from '@parse/node-apn';

let apnProvider;
let fcmTokenCache;

function base64Url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

async function getFcmAccessToken() {
  if (fcmTokenCache && fcmTokenCache.expiresAt > Date.now() + 60000) {
    return fcmTokenCache;
  }

  const serviceAccountPath = process.env.FCM_SERVICE_ACCOUNT_PATH;
  if (!serviceAccountPath || !fs.existsSync(serviceAccountPath)) {
    throw new Error('Missing FCM_SERVICE_ACCOUNT_PATH for Android push.');
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };
  const unsignedJwt = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(claim))}`;
  const signature = crypto
    .createSign('RSA-SHA256')
    .update(unsignedJwt)
    .sign(serviceAccount.private_key, 'base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsignedJwt}.${signature}`,
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error(`FCM auth failed: ${await tokenResponse.text()}`);
  }

  const tokenJson = await tokenResponse.json();
  fcmTokenCache = {
    projectId: serviceAccount.project_id,
    accessToken: tokenJson.access_token,
    expiresAt: Date.now() + Number(tokenJson.expires_in || 3600) * 1000,
  };

  return fcmTokenCache;
}

function getApnProvider() {
  if (apnProvider) {
    return apnProvider;
  }

  const keyPath = process.env.APNS_KEY_PATH;
  if (!keyPath || !fs.existsSync(keyPath)) {
    throw new Error('Missing APNS_KEY_PATH for iOS push.');
  }

  apnProvider = new apn.Provider({
    token: {
      key: keyPath,
      keyId: process.env.APNS_KEY_ID,
      teamId: process.env.APNS_TEAM_ID,
    },
    production: process.env.APNS_PRODUCTION === 'true',
  });

  return apnProvider;
}

export async function sendPush({ token, platform, title, body, data = {} }) {
  if (platform === 'android') {
    const fcm = await getFcmAccessToken();
    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${fcm.projectId}/messages:send`,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${fcm.accessToken}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title, body },
            data,
            android: {
              priority: 'HIGH',
              notification: {
                channel_id: 'default',
                sound: 'default',
              },
            },
          },
        }),
      },
    );

    const responseBody = await response.json();
    if (!response.ok) {
      throw new Error(`FCM send failed: ${JSON.stringify(responseBody)}`);
    }

    return { provider: 'fcm', response: responseBody };
  }

  if (platform === 'ios') {
    const notification = new apn.Notification({
      alert: { title, body },
      sound: 'default',
      topic: process.env.APNS_BUNDLE_ID,
      payload: data,
    });

    const response = await getApnProvider().send(notification, token);
    return { provider: 'apns', response };
  }

  throw new Error(`Unsupported push platform: ${platform}`);
}
