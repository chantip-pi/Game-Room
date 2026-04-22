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

 
  setProfileImage(url, publicId = null) {
    this.profileImage = {
      url,
      publicId,
      updatedAt: new Date()
    };
  }

  getProfileImage() {
    return this.profileImage;
  }

  hasProfileImage() {
    return this.profileImage !== null;
  }

  removeProfileImage() {
    this.profileImage = null;
  }

  getProfileImageUrl() {
    if (!this.profileImage) return null;
    
    if (typeof this.profileImage === 'string') {
      return this.profileImage;
    }
    
    if (this.profileImage.url) {
      return this.profileImage.url;
    }
    
    return null;
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
