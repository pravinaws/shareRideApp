const clients = new Map();

export function addRealtimeClient(userId, res) {
  const key = String(userId);
  const userClients = clients.get(key) || new Set();
  userClients.add(res);
  clients.set(key, userClients);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  res.on('close', () => {
    userClients.delete(res);
    if (!userClients.size) {
      clients.delete(key);
    }
  });
}

export function publishRealtime(userId, event, payload) {
  const userClients = clients.get(String(userId));
  if (!userClients) {
    return;
  }

  for (const res of userClients) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
  }
}
