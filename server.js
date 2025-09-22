const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const Logger = require('./src/logger');
const BotManager = require('./src/botManager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Configuration
const PORT = 5000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error('ADMIN_TOKEN environment variable is required');
  process.exit(1);
}

// Initialize services
const logger = new Logger(1000);
const botManager = new BotManager(logger);

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Authentication middleware for API
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1] || req.body.token;
  if (token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// API Routes
app.get('/api/status', (req, res) => {
  res.json(botManager.getStatus());
});

app.post('/api/connect', requireAuth, async (req, res) => {
  try {
    const { host, port, email, auth, version } = req.body;
    
    if (!host || !email) {
      return res.status(400).json({ error: 'Host and email are required' });
    }

    await botManager.start(host, port || 25565, email, auth || 'microsoft', version);
    res.json({ success: true, message: 'Connecting to server...' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/disconnect', requireAuth, (req, res) => {
  try {
    botManager.stop();
    res.json({ success: true, message: 'Bot disconnected' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/send', requireAuth, (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    botManager.sendMessage(text);
    res.json({ success: true, message: 'Message sent' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/clear', requireAuth, (req, res) => {
  logger.clear();
  res.json({ success: true, message: 'Logs cleared' });
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
  
  // Send backlog on connection
  ws.send(JSON.stringify({
    type: 'backlog',
    data: logger.getBacklog()
  }));
  
  // Send current status
  ws.send(JSON.stringify({
    type: 'status',
    data: botManager.getStatus()
  }));

  // Listen for new logs
  const logHandler = (logEntry) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'log',
        data: logEntry
      }));
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
      ws.send(JSON.stringify({
        type: 'clear',
        data: null
      }));
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

// Error handling
process.on('uncaughtException', (error) => {
  logger.log('error', `Uncaught exception: ${error.message}`, 'error');
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.log('error', `Unhandled rejection: ${reason}`, 'error');
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  botManager.stop();
  logger.destroy();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Minecraft Bot Web UI running on http://0.0.0.0:${PORT}`);
  logger.log('console', `Server started on port ${PORT}`, 'success');
});

module.exports = { app, server, logger, botManager };