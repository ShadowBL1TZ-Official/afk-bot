const mineflayer = require('mineflayer');
const { EventEmitter } = require('events');

class BotManager extends EventEmitter {
  constructor(logger) {
    super();
    this.logger = logger;
    this.bot = null;
    this.config = null;
    this.isConnected = false;
    this.isConnecting = false;
    this.reconnectTimeout = null;
    this.afkInterval = null;
    this.retryDelay = 5000;
  }

  async start(host, port = 25565, email, auth = 'microsoft', version = 'auto') {
    if (this.isConnecting || this.isConnected) {
      throw new Error('Bot is already connecting or connected');
    }

    this.config = { host, port, email, auth, version };
    this.isConnecting = true;

    try {
      this.logger.log(
        'console',
        `Attempting to connect to ${host}:${port} with email: ${email} (version: ${version})`,
        'info'
      );

      const botConfig = {
        host,
        port: parseInt(port),
        username: email,
        auth
      };

      if (version && version !== 'auto') {
        botConfig.version = version;
      }

      this.bot = mineflayer.createBot(botConfig);
      this.setupBotEvents();

    } catch (error) {
      this.isConnecting = false;
      this.logger.log('error', `Failed to create bot: ${error.message}`, 'error');
      throw error;
    }
  }

  setupBotEvents() {
    if (!this.bot) return;

    this.bot.once('spawn', () => {
      this.isConnected = true;
      this.isConnecting = false;

      const version = this.bot?.version || 'unknown';
      this.logger.log(
        'server',
        `Bot spawned on ${this.config.host}:${this.config.port} (v${version})`,
        'success'
      );

      this.startAfkPrevention();

      this.emit('statusChange', {
        connected: true,
        server: `${this.config.host}:${this.config.port}`,
        email: this.config.email,
        version
      });

      this.retryDelay = 5000;
    });

    this.bot.on('end', (reason) => {
      this.isConnected = false;
      this.isConnecting = false;
      this.stopAfkPrevention();

      this.logger.log('server', `Bot disconnected: ${reason || 'Unknown reason'}`, 'warning');

      this.emit('statusChange', {
        connected: false,
        server: null,
        email: null,
        version: 'unknown'
      });

      if (this.config) {
        this.logger.log('console', `Reconnecting in ${this.retryDelay / 1000}s...`, 'info');
        this.reconnectTimeout = setTimeout(() => {
          this.start(
            this.config.host,
            this.config.port,
            this.config.email,
            this.config.auth,
            this.config.version
          ).catch(error => {
            this.logger.log('error', `Reconnection failed: ${error.message}`, 'error');
          });
          this.retryDelay = Math.min(this.retryDelay * 2, 60000);
        }, this.retryDelay);
      }
    });

    this.bot.on('error', (error) => {
      this.isConnected = false;
      this.isConnecting = false;
      const msg = error?.message || JSON.stringify(error);
      this.logger.log('error', `Bot error: ${msg}`, 'error');

      this.emit('statusChange', {
        connected: false,
        server: null,
        email: null,
        version: 'unknown',
        error: msg
      });
    });

    this.bot.on('kicked', (reason) => {
      this.logger.log('server', `Bot was kicked: ${JSON.stringify(reason)}`, 'warning');
    });

    this.bot.on('messagestr', (message) => {
      if (!message.includes('§') || message.includes('[CHAT]')) {
        this.logger.log('chat', message, 'info');
      }
    });

    this.bot.on('login', () => {
      this.logger.log('server', 'Successfully logged in to server', 'success');
    });
  }

  startAfkPrevention() {
    if (this.afkInterval) return;
    this.afkInterval = setInterval(() => {
      if (this.bot && this.isConnected && this.bot.entity) {
        this.bot.look(
          this.bot.entity.yaw + (Math.random() - 0.5) * 0.2,
          this.bot.entity.pitch + (Math.random() - 0.5) * 0.2,
          true
        );
      }
    }, 30000);
  }

  stopAfkPrevention() {
    if (this.afkInterval) {
      clearInterval(this.afkInterval);
      this.afkInterval = null;
    }
  }

  stop() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    this.stopAfkPrevention();
    this.config = null;
    if (this.bot) {
      this.bot.end();
      this.bot = null;
    }
    this.isConnected = false;
    this.isConnecting = false;
    this.logger.log('console', 'Bot stopped', 'info');
    this.emit('statusChange', {
      connected: false,
      server: null,
      email: null,
      version: 'unknown'
    });
  }

  sendMessage(text) {
    if (!this.bot || !this.isConnected) {
      throw new Error('Bot is not connected');
    }
    try {
      this.bot.chat(text);
      this.logger.log('console', `Sent ${text.startsWith('/') ? 'command' : 'message'}: ${text}`, 'info');
    } catch (error) {
      this.logger.log('error', `Failed to send message: ${error.message}`, 'error');
      throw error;
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      connecting: this.isConnecting,
      server: this.config ? `${this.config.host}:${this.config.port}` : null,
      email: this.config ? this.config.email : null,
      version: (this.bot && typeof this.bot.version === 'string') ? this.bot.version : 'unknown'
    };
  }
}

module.exports = BotManager;
