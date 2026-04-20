class RoomRepository {
  constructor() {
    this._rooms = new Map();
    this._roomUsers = new Map();
    this._roomMessages = new Map();
  }

  // --- Room ---

  createRoom(roomCode, roomData) {
    this._rooms.set(roomCode, { 
      createdAt: new Date(), 
      ...roomData 
    });
    this._roomUsers.set(roomCode, new Set());
    this._roomMessages.set(roomCode, []);
  }

  roomExists(roomCode) {
    return this._rooms.has(roomCode);
  }

  deleteRoom(roomCode) {
    this._rooms.delete(roomCode);
    this._roomUsers.delete(roomCode);
    this._roomMessages.delete(roomCode);
  }

  // --- Users ---

  addUser(roomCode, username) {
    if (!this._roomUsers.has(roomCode)) {
      this._roomUsers.set(roomCode, new Set());
    }
    this._roomUsers.get(roomCode).add(username);
  }

  removeUser(roomCode, username) {
    const users = this._roomUsers.get(roomCode);
    if (users) {
      users.delete(username);
    }
  }

  getUsersInRoom(roomCode) {
    return Array.from(this._roomUsers.get(roomCode) ?? []);
  }

  getRoomUserCount(roomCode) {
    return this._roomUsers.get(roomCode)?.size ?? 0;
  }

  // --- Messages ---

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

  getRoomInfo(roomCode) {
    return this._rooms.get(roomCode);
  }
}

module.exports = new RoomRepository();