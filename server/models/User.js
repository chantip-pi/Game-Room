class User {
  constructor(username, socketId = null, profileImage = null) {
    this.username = username;
    this.socketId = socketId;
    this.profileImage = profileImage;
    this.joinedAt = new Date();
    this.isActive = true;
  }

  updateSocketId(socketId) {
    this.socketId = socketId;
    this.isActive = true;
  }

  setProfile(profileImage) {
    this.profileImage = profileImage;
  }

  deactivate() {
    this.isActive = false;
    this.socketId = null;
  }

  toJSON() {
    return {
      username: this.username,
      socketId: this.socketId,
      profileImage: this.profileImage,
      joinedAt: this.joinedAt,
      isActive: this.isActive
    };
  }

  static fromJSON(data) {
    const user = new User(data.username, data.socketId, data.profileImage);
    user.joinedAt = new Date(data.joinedAt);
    user.isActive = data.isActive;
    return user;
  }
}

module.exports = User;
