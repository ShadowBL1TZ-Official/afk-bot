const { EventEmitter } = require('events');

class Logger extends EventEmitter {
  constructor(maxLines = 1000) {
    super();
    this.logs = [];
    this.maxLines = maxLines;
    this.originalWrite = process.stdout.write;
    this.setupStdoutCapture();
  }

  setupStdoutCapture() {
    const self = this;
    process.stdout.write = function(string, encoding, fd) {
      // Call original write first
      self.originalWrite.call(process.stdout, string, encoding, fd);
      
      // Capture MSA auth prompts and other important stdout messages
      const line = string.toString();
      if (line.includes('[msa]') || line.includes('microsoft.com/link') || 
          line.includes('To sign in') || line.includes('use the code')) {
        self.log('auth', line.trim(), 'info');
      }
      
      return true;
    };
  }

  log(type, message, level = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type, // 'chat', 'console', 'server', 'auth', 'error'
      message: this.sanitizeMessage(message),
      level
    };

    this.logs.push(logEntry);
    
    // Keep only the last maxLines entries
    if (this.logs.length > this.maxLines) {
      this.logs.shift();
    }

    // Emit the log event for real-time streaming
    this.emit('log', logEntry);
    
    // Use original write to avoid infinite recursion
    this.originalWrite.call(process.stdout, `[${type.toUpperCase()}] ${message}\n`);
  }

  sanitizeMessage(message) {
    // Remove or mask sensitive information
    let sanitized = message;
    
    // Mask tokens but keep auth flow messages visible
    if (typeof sanitized === 'string') {
      sanitized = sanitized.replace(/access_token['":\s]*[^,\s}'"]+/gi, 'access_token: [MASKED]');
      sanitized = sanitized.replace(/refresh_token['":\s]*[^,\s}'"]+/gi, 'refresh_token: [MASKED]');
    }
    
    return sanitized;
  }

  getBacklog() {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.emit('clear');
  }

  destroy() {
    // Restore original stdout.write
    process.stdout.write = this.originalWrite;
  }
}

module.exports = Logger;