// Server-Sent Events (SSE) Hub for real-time queue synchronization

const clients = new Set();

export function registerSSEClient(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const client = {
    id: Date.now() + '-' + Math.random().toString(36).substring(2, 9),
    userId: req.user ? req.user.id : null,
    res
  };

  clients.add(client);

  // Send initial connected acknowledgement
  res.write(`event: connected\ndata: ${JSON.stringify({ clientId: client.id, timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    clients.delete(client);
  });
}

// Keep-alive heartbeat every 25 seconds to prevent browser timeouts
setInterval(() => {
  for (const client of clients) {
    try {
      client.res.write(': heartbeat\n\n');
    } catch {
      clients.delete(client);
    }
  }
}, 25000);

export function broadcastQueueUpdate(payload) {
  const data = JSON.stringify(payload);
  for (const client of clients) {
    try {
      client.res.write(`event: queue_update\ndata: ${data}\n\n`);
    } catch {
      clients.delete(client);
    }
  }
}

export function notifyUserRealtime(userId, notificationPayload) {
  const data = JSON.stringify(notificationPayload);
  for (const client of clients) {
    if (client.userId === userId) {
      try {
        client.res.write(`event: user_alert\ndata: ${data}\n\n`);
      } catch {
        clients.delete(client);
      }
    }
  }
}
