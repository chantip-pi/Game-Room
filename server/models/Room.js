class Room {
  constructor(roomCode, createdBy, gameSettings = {}) {
    this.roomCode = roomCode;
    this.createdBy = createdBy;
    this.createdAt = new Date();
    this.gameSettings = gameSettings;
    this.users = new Map();
    this.messages = [];
    this.pawnPositions = new Map();
    this.isActive = true;
  }

  addUser(user) {
    this.users.set(user.username, user);
  }

  removeUser(username) {
    this.users.delete(username);
    this.pawnPositions.delete(username);
  }

  getUser(username) {
    return this.users.get(username);
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }

  getUserCount() {
    return this.users.size;
  }

  isEmpty() {
    return this.users.size === 0;
  }

  addMessage(message) {
    this.messages.push(message);
  }

  getMessages() {
    return this.messages;
  }

  updatePawnPosition(username, position) {
    this.pawnPositions.set(username, position);
  }

  getPawnPosition(username) {
    return this.pawnPositions.get(username);
  }

  getAllPawnPositions() {
    return Object.fromEntries(this.pawnPositions);
  }

  removePawnPosition(username) {
    this.pawnPositions.delete(username);
  }

  deactivate() {
    this.isActive = false;
  }

  toJSON() {
    return {
      roomCode: this.roomCode,
      createdBy: this.createdBy,
      createdAt: this.createdAt,
      gameSettings: this.gameSettings,
      users: Array.from(this.users.values()).map(user => user.toJSON()),
      messages: this.messages,
      pawnPositions: this.getAllPawnPositions(),
      isActive: this.isActive,
      userCount: this.getUserCount()
    };
  }

  static fromJSON(data) {
    const room = new Room(data.roomCode, data.createdBy, data.gameSettings);
    room.createdAt = new Date(data.createdAt);
    room.isActive = data.isActive;
    
    // Restore users
    data.users.forEach(userData => {
      const user = User.fromJSON(userData);
      room.users.set(user.username, user);
    });
    
    // Restore messages
    room.messages = data.messages;
    
    // Restore pawn positions
    room.pawnPositions = new Map(Object.entries(data.pawnPositions));
    
    return room;
  }
}

module.exports = Room;
