const roomRepository = require('../repositories/RoomRepository');
const userService = require('./UserService');
const messageService = require('./MessageService');
const pawnService = require('./PawnService');
const imageService = require('./ImageService');
const { generateRoomCode } = require('../utils/generateRoomCode');
const { Room, User, Message } = require('../models/index');

class RoomService {
  constructor() {
    this.roomRepository = roomRepository;
    this.userService = userService;
    this.messageService = messageService;
    this.pawnService = pawnService;
  }

  createRoom(username, gameSettings = {}, profileImage = null) {
    let roomCode;
    do {
      roomCode = generateRoomCode();
    } while (roomRepository.roomExists(roomCode));

    // Create room model instance
    const room = new Room(roomCode, username, gameSettings);
    
    // Store room data
    roomRepository.createRoom(roomCode, room.toJSON());
    userService.joinRoom(roomCode, username, null, profileImage);

    return roomCode;
  }

  joinRoom(roomCode, username) {
    if (!roomRepository.roomExists(roomCode)) {
      throw new Error('Invalid room code. Room does not exist.');
    }
    
    userService.joinRoom(roomCode, username);
  }

  leaveRoom(roomCode, username) {
    // Clean up pawn position
    pawnService.removePawnPosition(roomCode, username);
    
    userService.leaveRoom(roomCode, username);

    const isEmpty = userService.getRoomUserCount(roomCode) === 0;
    if (isEmpty) {
      // Delete the room
      roomRepository.deleteRoom(roomCode);
      
      // Clean up all related data for this room
      this.cleanupRoom(roomCode);
      
      return { roomDeleted: true };
    }

    return {
      roomDeleted: false,
      users: userService.getUsersInRoom(roomCode),
    };
  }

  getUsersInRoom(roomCode) {
    return userService.getUsersInRoom(roomCode);
  }

  addMessage(roomCode, message) {
    // Handle both Message model and plain object
    const messageData = message instanceof Message ? message.toJSON() : message;
    messageService.addMessage(roomCode, messageData);
  }

  getMessageHistory(roomCode) {
    return messageService.getMessages(roomCode);
  }

  getRoomInfo(roomCode) {
    const roomData = roomRepository.getRoomInfo(roomCode);
    if (roomData) {
      // Convert to Room model if needed
      return roomData;
    }
    return null;
  }

  // Pawn position management - delegate to PawnService
  updatePawnPosition(roomCode, username, position) {
    pawnService.updatePawnPosition(roomCode, username, position);
  }

  getPawnPositions(roomCode) {
    return pawnService.getPawnPositions(roomCode);
  }

  removePawnPosition(roomCode, username) {
    pawnService.removePawnPosition(roomCode, username);
  }

  // User profile management - delegate to UserService
  setUserProfile(roomCode, username, profileImage) {
    userService.setUserProfile(roomCode, username, profileImage);
  }

  getUserProfile(roomCode, username) {
    return userService.getUserProfile(roomCode, username);
  }

  getUserProfiles(roomCode) {
    return userService.getUserProfiles(roomCode);
  }

  removeUserProfile(roomCode, username) {
    userService.removeUserProfile(roomCode, username);
  }

  // Get room as Room model instance
  getRoom(roomCode) {
    const roomData = roomRepository.getRoomInfo(roomCode);
    if (roomData) {
      return Room.fromJSON(roomData);
    }
    return null;
  }

  // Update room settings
  updateRoomSettings(roomCode, settings) {
    const room = this.getRoom(roomCode);
    if (room) {
      Object.assign(room.gameSettings, settings);
      roomRepository.updateRoomInfo(roomCode, room.toJSON());
      return room;
    }
    return null;
  }

  // Check if room is full
  isRoomFull(roomCode, maxPlayers = 4) {
    const userCount = userService.getRoomUserCount(roomCode);
    return userCount >= maxPlayers;
  }

  // Cleanup method for room deletion
  cleanupRoom(roomCode) {
    userService.cleanupRoom(roomCode);
    messageService.cleanupRoom(roomCode);
    pawnService.cleanupRoom(roomCode);
    imageService.cleanupRoom(roomCode);
  }
}

module.exports = new RoomService();