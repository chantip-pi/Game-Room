const messageRepository = require('../repositories/MessageRepository');
const { Message } = require('../models/index');

class MessageService {
  constructor() {
    this.messageRepository = messageRepository;
  }

  validate(socket, room) {
    if (!socket.room || socket.room !== room) {
      throw new Error('You are not in this room.');
    }
  }

  build({ message, username, timestamp, room }) {
    return new Message(message, username, room, timestamp);
  }

  addMessage(roomCode, message) {
    // Handle both Message model and plain object
    const messageData = message instanceof Message ? message.toJSON() : message;
    this.messageRepository.addMessage(roomCode, messageData);
  }

  getMessages(roomCode) {
    const messages = this.messageRepository.getMessages(roomCode);
    // Convert plain objects to Message models if needed
    return messages.map(msg => {
      if (msg.id && msg.type) {
        return Message.fromJSON(msg);
      }
      return msg;
    });
  }

  getMessageCount(roomCode) {
    return this.messageRepository.getMessageCount(roomCode);
  }

  // Get messages as plain objects for socket emission
  getMessagesForSocket(roomCode) {
    return this.messageRepository.getMessages(roomCode);
  }

  // Add system message
  addSystemMessage(roomCode, content) {
    const systemMessage = Message.createSystemMessage(content, roomCode);
    this.addMessage(roomCode, systemMessage);
    return systemMessage;
  }

  // Add game message
  addGameMessage(roomCode, content, username) {
    const gameMessage = Message.createGameMessage(content, username, roomCode);
    this.addMessage(roomCode, gameMessage);
    return gameMessage;
  }

  // Validate message content
  validateMessageContent(content) {
    if (!content || typeof content !== 'string') {
      throw new Error('Message content must be a non-empty string.');
    }
    
    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      throw new Error('Message content cannot be empty.');
    }
    
    if (trimmedContent.length > 500) {
      throw new Error('Message content cannot exceed 500 characters.');
    }
    
    return trimmedContent;
  }

  // Get recent messages (limit count)
  getRecentMessages(roomCode, limit = 50) {
    const messages = this.getMessages(roomCode);
    return messages.slice(-limit);
  }

  // Clear messages
  clearMessages(roomCode) {
    this.messageRepository.clearMessages(roomCode);
  }

  // Cleanup room
  cleanupRoom(roomCode) {
    this.messageRepository.cleanupRoom(roomCode);
  }
}

module.exports = new MessageService();