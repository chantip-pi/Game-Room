const userRepository = require('../repositories/UserRepository');
const { User } = require('../models/index');


class UserService {
  constructor() {
    this.userRepository = userRepository;
  }

  joinRoom(roomCode, username, socketId = null, profileImage = null) {
    // Create user model instance
    const user = new User(username, socketId, profileImage);
    this.userRepository.addUser(roomCode, user.toJSON());
  }

  leaveRoom(roomCode, username) {
    this.userRepository.removeUser(roomCode, username);
  }

  getUsersInRoom(roomCode) {
    const users = this.userRepository.getUsersInRoom(roomCode);
    // Convert to User models if needed
    return users.map(userData => {
      if (userData.username && userData.joinedAt) {
        return User.fromJSON(userData);
      }
      return userData;
    });
  }

  // Get users as plain objects for socket emission
  getUsersInRoomForSocket(roomCode) {
    return this.userRepository.getUsersInRoom(roomCode);
  }

  getRoomUserCount(roomCode) {
    return this.userRepository.getRoomUserCount(roomCode);
  }

  userExistsInRoom(roomCode, username) {
    return this.userRepository.userExistsInRoom(roomCode, username);
  }

  // Get specific user
  getUser(roomCode, username) {
    const userData = this.userRepository.getUserProfile(roomCode, username);
    if (userData) {
      return User.fromJSON(userData);
    }
    return null;
  }

  // Update user socket ID
  updateUserSocket(roomCode, username, socketId) {
    const user = this.getUser(roomCode, username);
    if (user) {
      user.updateSocketId(socketId);
      this.userRepository.updateUser(roomCode, username, user.toJSON());
      return user;
    }
    return null;
  }

  // Deactivate user (on disconnect)
  deactivateUser(roomCode, username) {
    const user = this.getUser(roomCode, username);
    if (user) {
      user.deactivate();
      this.userRepository.updateUser(roomCode, username, user.toJSON());
      return user;
    }
    return null;
  }

  // Profile management
  setUserProfile(roomCode, username, profileImage) {
    const user = this.getUser(roomCode, username);
    if (user) {
      user.setProfile(profileImage);
      this.userRepository.updateUser(roomCode, username, user.toJSON());
      return user;
    }
    return null;
  }

  getUserProfile(roomCode, username) {
    return this.userRepository.getUserProfile(roomCode, username);
  }

  getUserProfiles(roomCode) {
    return this.userRepository.getUserProfiles(roomCode);
  }

  removeUserProfile(roomCode, username) {
    const user = this.getUser(roomCode, username);
    if (user) {
      user.setProfile(null);
      this.userRepository.updateUser(roomCode, username, user.toJSON());
      return user;
    }
    return null;
  }

  // Validate username
  validateUsername(username) {
    if (!username || typeof username !== 'string') {
      throw new Error('Username must be a non-empty string.');
    }
    
    const trimmedUsername = username.trim();
    if (trimmedUsername.length === 0) {
      throw new Error('Username cannot be empty.');
    }
    
    if (trimmedUsername.length > 20) {
      throw new Error('Username cannot exceed 20 characters.');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens.');
    }
    
    return trimmedUsername;
  }

  // Check if username is available in room
  isUsernameAvailable(roomCode, username) {
    return !this.userExistsInRoom(roomCode, username);
  }

  // Get active users only
  getActiveUsers(roomCode) {
    const users = this.getUsersInRoom(roomCode);
    return users.filter(user => user.isActive);
  }

  // Cleanup
  cleanupRoom(roomCode) {
    this.userRepository.cleanupRoom(roomCode);
  }
}

module.exports = new UserService();
