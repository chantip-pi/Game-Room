const userRepository = require('../repositories/UserRepository');
const { User } = require('../models/index');


class UserService {
  constructor() {
    this.userRepository = userRepository;
  }

  joinRoom(roomCode, username, socketId = null, profileImage = null) {
    // Check if user already exists
    const existingUser = this.userRepository.getUser(roomCode, username);
    if (existingUser) {
      // Update existing user instead of creating new one
      existingUser.socketId = socketId;
      existingUser.isActive = true;
      if (profileImage) {
        existingUser.profileImage = profileImage;
      }
      this.userRepository.updateUser(roomCode, username, existingUser);
      console.log(`Updated existing user ${username} in room ${roomCode}`);
    } else {
      // Create new user model instance
      const user = new User(username, socketId, profileImage);
      this.userRepository.addUser(roomCode, user.toJSON());
      console.log(`Created new user ${username} in room ${roomCode}`);
    }
  }

  leaveRoom(roomCode, username) {
    this.userRepository.removeUser(roomCode, username);
  }

  getUsersInRoom(roomCode) {
    const users = this.userRepository.getUsersInRoom(roomCode);
    // Convert to User models if needed and filter active users only
    return users
      .filter(userData => userData.isActive !== false)
      .map(userData => {
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
    const users = this.userRepository.getUsersInRoom(roomCode);
    return users.filter(userData => userData.isActive !== false).length;
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
    const user = this.getUser(roomCode, username);
    return user ? user.profileImage : null;
  }

  getUserProfiles(roomCode) {
    const users = this.getUsersInRoom(roomCode);
    const profiles = {};
    users.forEach(user => {
      if (user.profileImage) {
        profiles[user.username] = user.profileImage;
      }
    });
    return profiles;
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
