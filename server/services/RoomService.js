const roomRepository = require('../repositories/RoomRepository');
const { generateRoomCode } = require('../utils/generateRoomCode');

class RoomService {
  constructor() {
    this.roomRepository = roomRepository;
    this.pawnPositions = new Map(); // Store pawn positions by room
    this.userProfiles = new Map(); // Store user profiles by room
  }

  createRoom(username, gameSettings = {}) {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (roomRepository.roomExists(roomCode));

    roomRepository.createRoom(roomCode, { createdBy: username, ...gameSettings });
    roomRepository.addUser(roomCode, username);

    return roomCode;
  }

  joinRoom(roomCode, username) {
    if (!roomRepository.roomExists(roomCode)) {
      throw new Error('Invalid room code. Room does not exist.');
    }
    roomRepository.addUser(roomCode, username);
  }

  leaveRoom(roomCode, username) {
    // Clean up pawn position
    this.removePawnPosition(roomCode, username);
    
    roomRepository.removeUser(roomCode, username);

    const isEmpty = roomRepository.getRoomUserCount(roomCode) === 0;
    if (isEmpty) {
      // Delete the room
      roomRepository.deleteRoom(roomCode);
      
      // Clean up pawn positions for this room
      this.pawnPositions.delete(roomCode);
      
      return { roomDeleted: true };
    }

    return {
      roomDeleted: false,
      users: roomRepository.getUsersInRoom(roomCode),
    };
  }

  getUsersInRoom(roomCode) {
    return roomRepository.getUsersInRoom(roomCode);
  }

  addMessage(roomCode, message) {
    roomRepository.addMessage(roomCode, message);
  }

  getMessageHistory(roomCode) {
    return roomRepository.getMessages(roomCode);
  }

  getRoomInfo(roomCode) {
    return roomRepository.getRoomInfo(roomCode);
  }

  // Pawn position management
  updatePawnPosition(roomCode, username, position) {
    if (!this.pawnPositions.has(roomCode)) {
      this.pawnPositions.set(roomCode, new Map());
    }
    this.pawnPositions.get(roomCode).set(username, position);
  }

  getPawnPositions(roomCode) {
    const roomPawns = this.pawnPositions.get(roomCode);
    return roomPawns ? Object.fromEntries(roomPawns) : {};
  }

  removePawnPosition(roomCode, username) {
    const roomPawns = this.pawnPositions.get(roomCode);
    if (roomPawns) {
      roomPawns.delete(username);
      // Clean up empty room entries
      if (roomPawns.size === 0) {
        this.pawnPositions.delete(roomCode);
      }
    }
  }

  // User profile management
  setUserProfile(roomCode, username, profileImage) {
    if (!this.userProfiles.has(roomCode)) {
      this.userProfiles.set(roomCode, new Map());
    }
    this.userProfiles.get(roomCode).set(username, profileImage);
  }

  getUserProfile(roomCode, username) {
    const roomProfiles = this.userProfiles.get(roomCode);
    return roomProfiles ? roomProfiles.get(username) : null;
  }

  getUserProfiles(roomCode) {
    const roomProfiles = this.userProfiles.get(roomCode);
    return roomProfiles ? Object.fromEntries(roomProfiles) : {};
  }

  removeUserProfile(roomCode, username) {
    const roomProfiles = this.userProfiles.get(roomCode);
    if (roomProfiles) {
      roomProfiles.delete(username);
      // Clean up empty room entries
      if (roomProfiles.size === 0) {
        this.userProfiles.delete(roomCode);
      }
    }
  }
}

module.exports = new RoomService();