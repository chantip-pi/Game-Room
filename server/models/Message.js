class Message {
  constructor(content, username, roomCode, timestamp = null) {
    this.id = this.generateId();
    this.content = content;
    this.username = username;
    this.roomCode = roomCode;
    this.timestamp = timestamp || new Date();
    this.type = 'user'; // Can be 'user', 'system', 'game'
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  isSystemMessage() {
    return this.type === 'system';
  }

  isGameMessage() {
    return this.type === 'game';
  }

  static createSystemMessage(content, roomCode) {
    const message = new Message(content, 'System', roomCode);
    message.type = 'system';
    return message;
  }

  static createGameMessage(content, username, roomCode) {
    const message = new Message(content, username, roomCode);
    message.type = 'game';
    return message;
  }

  toJSON() {
    return {
      id: this.id,
      content: this.content,
      username: this.username,
      roomCode: this.roomCode,
      timestamp: this.timestamp,
      type: this.type
    };
  }

  static fromJSON(data) {
    const message = new Message(data.content, data.username, data.roomCode, new Date(data.timestamp));
    message.id = data.id;
    message.type = data.type;
    return message;
  }
}

module.exports = Message;
