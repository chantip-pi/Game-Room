class MessageRepository {
  constructor() {
    this._roomMessages = new Map();
  }

  addMessage(roomCode, message) {
    if (!this._roomMessages.has(roomCode)) {
      this._roomMessages.set(roomCode, []);
    }
    this._roomMessages.get(roomCode).push(message);
    
    // Keep only last 100 messages per room to prevent memory issues
    const messages = this._roomMessages.get(roomCode);
    if (messages.length > 100) {
      messages.shift();
    }
  }

  getMessages(roomCode) {
    return this._roomMessages.get(roomCode) ?? [];
  }

  getMessageCount(roomCode) {
    return this._roomMessages.get(roomCode)?.length ?? 0;
  }

  clearMessages(roomCode) {
    this._roomMessages.delete(roomCode);
  }

  cleanupRoom(roomCode) {
    this._roomMessages.delete(roomCode);
  }
}

module.exports = new MessageRepository();
