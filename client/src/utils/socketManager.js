import io from 'socket.io-client';

class SocketManager {
  constructor() {
    this.socket = null;
    this.serverUrl = 'http://localhost:3001';
  }

  connect() {
    if (!this.socket) {
      this.socket = io.connect(this.serverUrl, {
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
        maxReconnectionAttempts: 5
      });

      this.socket.on('connect', () => {
        console.log('Connected to server with socket ID:', this.socket.id);
      });

      this.socket.on('disconnect', (reason) => {
        console.log('Disconnected from server. Reason:', reason);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket() {
    if (!this.socket) {
      return this.connect();
    }
    return this.socket;
  }

  emit(event, data) {
    const socket = this.getSocket();
    socket.emit(event, data);
  }

  on(event, callback) {
    const socket = this.getSocket();
    socket.on(event, callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export default new SocketManager();
