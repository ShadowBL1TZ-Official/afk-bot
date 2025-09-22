class MinecraftBotUI {
  constructor() {
    this.ws = null;
    this.adminToken = this.getAdminToken();
    this.currentFilter = 'all';
    this.logs = [];
    this.isConnected = false;
    
    this.initializeElements();
    this.setupEventListeners();
    this.loadStatus();
    this.connectWebSocket();
  }

  initializeElements() {
    this.elements = {
      status: document.getElementById('status'),
      statusDot: document.querySelector('.status-dot'),
      statusText: document.querySelector('.status-text'),
      configForm: document.getElementById('config-form'),
      hostInput: document.getElementById('host'),
      portInput: document.getElementById('port'),
      emailInput: document.getElementById('email'),
      authSelect: document.getElementById('auth'),
      connectBtn: document.getElementById('connect-btn'),
      disconnectBtn: document.getElementById('disconnect-btn'),
      console: document.getElementById('console'),
      chatInput: document.getElementById('chat-input'),
      sendBtn: document.getElementById('send-btn'),
      clearBtn: document.getElementById('clear-btn'),
      filterChips: document.querySelectorAll('.filter-chip')
    };
  }

  setupEventListeners() {
    this.elements.connectBtn.addEventListener('click', () => this.connect());
    this.elements.disconnectBtn.addEventListener('click', () => this.disconnect());
    
    this.elements.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.sendMessage();
      } else if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        this.clearLogs();
      }
    });
    
    this.elements.sendBtn.addEventListener('click', () => this.sendMessage());
    this.elements.clearBtn.addEventListener('click', () => this.clearLogs());
    
    this.elements.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        this.setFilter(chip.dataset.filter);
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.target === document.body && !e.ctrlKey && !e.altKey && !e.metaKey) {
        this.elements.chatInput.focus();
      }
    });
  }

  async loadStatus() {
    try {
      const response = await fetch('/api/status');
      const status = await response.json();
      this.updateStatus(status);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws?token=${this.adminToken}`;
    
    this.ws = new WebSocket(wsUrl);
    
    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleWebSocketMessage(message);
    };
    
    this.ws.onclose = (event) => {
      console.log('WebSocket disconnected:', event.code, event.reason);
      setTimeout(() => {
        if (this.ws.readyState === WebSocket.CLOSED) {
          this.connectWebSocket();
        }
      }, 3000);
    };
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'backlog':
        this.logs = message.data || [];
        this.renderLogs();
        break;
      case 'log':
        this.logs.push(message.data);
        if (this.logs.length > 1000) {
          this.logs.shift();
        }
        this.renderLogs();
        break;
      case 'status':
        this.updateStatus(message.data);
        break;
      case 'clear':
        this.logs = [];
        this.renderLogs();
        break;
    }
  }

  updateStatus(status) {
    this.isConnected = status.connected;
    
    if (status.connected) {
      this.elements.statusDot.className = 'status-dot connected';
      this.elements.statusText.textContent = `Connected to ${status.server}`;
      this.elements.connectBtn.disabled = true;
      this.elements.disconnectBtn.disabled = false;
      this.elements.chatInput.disabled = false;
      this.elements.sendBtn.disabled = false;
    } else if (status.connecting) {
      this.elements.statusDot.className = 'status-dot connecting';
      this.elements.statusText.textContent = 'Connecting...';
      this.elements.connectBtn.disabled = true;
      this.elements.disconnectBtn.disabled = false;
    } else {
      this.elements.statusDot.className = 'status-dot disconnected';
      this.elements.statusText.textContent = 'Disconnected';
      this.elements.connectBtn.disabled = false;
      this.elements.disconnectBtn.disabled = true;
      this.elements.chatInput.disabled = true;
      this.elements.sendBtn.disabled = true;
    }

    if (status.error) {
      this.elements.statusDot.className = 'status-dot error';
      this.elements.statusText.textContent = `Error: ${status.error}`;
    }
  }

  async connect() {
    const host = this.elements.hostInput.value.trim();
    const port = this.elements.portInput.value.trim();
    const email = this.elements.emailInput.value.trim();
    const auth = this.elements.authSelect.value;

    if (!host || !email) {
      alert('Please enter both host and email');
      return;
    }

    try {
      const response = await fetch('/api/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        },
        body: JSON.stringify({ host, port, email, auth })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      console.log('Connection initiated:', result.message);
    } catch (error) {
      console.error('Failed to connect:', error);
      alert(`Failed to connect: ${error.message}`);
    }
  }

  async disconnect() {
    try {
      const response = await fetch('/api/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      console.log('Disconnected:', result.message);
    } catch (error) {
      console.error('Failed to disconnect:', error);
      alert(`Failed to disconnect: ${error.message}`);
    }
  }

  async sendMessage() {
    const text = this.elements.chatInput.value.trim();
    
    if (!text || !this.isConnected) {
      return;
    }

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        },
        body: JSON.stringify({ text })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

      this.elements.chatInput.value = '';
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(`Failed to send message: ${error.message}`);
    }
  }

  async clearLogs() {
    try {
      const response = await fetch('/api/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.adminToken}`
        }
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to clear logs:', error);
      alert(`Failed to clear logs: ${error.message}`);
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    this.elements.filterChips.forEach(chip => {
      chip.classList.toggle('active', chip.dataset.filter === filter);
    });
    
    this.renderLogs();
  }

  renderLogs() {
    const filteredLogs = this.currentFilter === 'all' 
      ? this.logs 
      : this.logs.filter(log => log.type === this.currentFilter);

    const html = filteredLogs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      return `<div class="log-entry ${log.type} ${log.level}">
        <span class="timestamp">${time}</span>${this.escapeHtml(log.message)}
      </div>`;
    }).join('');

    this.elements.console.innerHTML = html;
    this.elements.console.scrollTop = this.elements.console.scrollHeight;
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  getAdminToken() {
    let token = sessionStorage.getItem('adminToken');
    if (!token) {
      token = prompt('Enter admin token:');
      if (token) {
        sessionStorage.setItem('adminToken', token);
      } else {
        alert('Admin token is required to use this interface');
        location.reload();
      }
    }
    return token;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new MinecraftBotUI();
});