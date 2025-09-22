app.get('/api/status', (req, res) => {
  const status = botManager.getStatus();
  res.json(status);
});

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  
  if (token !== ADMIN_TOKEN) {
    ws.close(1008, 'Unauthorized');
    return;
  }

  console.log('WebSocket client connected');
  
  ws.send(JSON.stringify({
    type: 'backlog',
    data: logger.getBacklog()
  }));
  
  ws.send(JSON.stringify({
    type: 'status',
    data: botManager.getStatus()
  }));

  const logHandler = (logEntry) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'log', data: logEntry }));
    }
  };
  
  const statusHandler = (status) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'status',
        data: status
      }));
    }
  };

  const clearHandler = () => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'clear', data: null }));
    }
  };

  logger.on('log', logHandler);
  botManager.on('statusChange', statusHandler);
  logger.on('clear', clearHandler);

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    logger.removeListener('log', logHandler);
    botManager.removeListener('statusChange', statusHandler);
    logger.removeListener('clear', clearHandler);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});
