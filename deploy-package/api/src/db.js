import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.MYSQL_PORT || 3306),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'fastforward',
  waitForConnections: true,
  connectionLimit: 10,
});

export async function upsertDeviceToken({ token, platform, deviceName }) {
  await pool.execute(
    `INSERT INTO device_tokens (token, platform, device_name)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE platform = VALUES(platform), device_name = VALUES(device_name)`,
    [token, platform, deviceName || null],
  );
}

export async function saveNotificationLog({ token, platform, title, body, provider, response }) {
  await pool.execute(
    `INSERT INTO notification_logs (token, platform, title, body, provider, provider_response)
     VALUES (?, ?, ?, ?, ?, CAST(? AS JSON))`,
    [token, platform, title, body, provider, JSON.stringify(response || {})],
  );
}
