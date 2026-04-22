class UserRepository {
  constructor() {
    this._roomUsers = new Map();
    this._userProfiles = new Map();
  }

  // --- User Management ---

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

  userExistsInRoom(roomCode, username) {
    const users = this._roomUsers.get(roomCode);
    return users ? users.has(username) : false;
  }

  // --- User Profile Management ---

  setUserProfile(roomCode, username, profileImage) {
    if (!this._userProfiles.has(roomCode)) {
      this._userProfiles.set(roomCode, new Map());
    }
    this._userProfiles.get(roomCode).set(username, profileImage);
  }

  getUserProfile(roomCode, username) {
    const roomProfiles = this._userProfiles.get(roomCode);
    return roomProfiles ? roomProfiles.get(username) : null;
  }

  getUserProfiles(roomCode) {
    const roomProfiles = this._userProfiles.get(roomCode);
    return roomProfiles ? Object.fromEntries(roomProfiles) : {};
  }

  removeUserProfile(roomCode, username) {
    const roomProfiles = this._userProfiles.get(roomCode);
    if (roomProfiles) {
      roomProfiles.delete(username);
      // Clean up empty room entries
      if (roomProfiles.size === 0) {
        this._userProfiles.delete(roomCode);
      }
    }
  }

  // --- Cleanup ---

  cleanupRoom(roomCode) {
    this._roomUsers.delete(roomCode);
    this._userProfiles.delete(roomCode);
  }
}

module.exports = new UserRepository();
