const roomRepository = require('../repositories/RoomRepository');
const { generateRoomCode } = require('../utils/generateRoomCode');
const cloudinary = require('cloudinary').v2;

class RoomService {
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
    roomRepository.removeUser(roomCode, username);

    const isEmpty = roomRepository.getRoomUserCount(roomCode) === 0;
    if (isEmpty) {
      // Get room info before deletion for cleanup
      const roomInfo = roomRepository.getRoomInfo(roomCode);
      const mapPublicId = roomInfo?.gameSettings?.mapPublicId;
      
      // Delete the room
      roomRepository.deleteRoom(roomCode);
      
      // Clean up image from Cloudinary if it exists
      if (mapPublicId) {
        this.cleanupMapImage(mapPublicId);
      }
      
      return { roomDeleted: true, imageCleanedUp: !!mapPublicId };
    }

    return {
      roomDeleted: false,
      users: roomRepository.getUsersInRoom(roomCode),
    };
  }

  async cleanupMapImage(publicId) {
    try {
      console.log(`Cleaning up map image: ${publicId}`);
      
      // Configure Cloudinary (in production, use environment variables)
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'game_room',
        api_key: process.env.CLOUDINARY_API_KEY || '337285976619952',
        api_secret: process.env.CLOUDINARY_API_SECRET || 'W0yNI4cPRr3uJQOPqyuoOBHfvbs'
      });
      
      // Delete the image from Cloudinary
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result === 'ok') {
        console.log(`Successfully deleted image: ${publicId}`);
        return { success: true, publicId, result };
      } else {
        console.warn(`Image deletion returned: ${result.result}`, publicId);
        return { success: false, publicId, result: result.result };
      }
    } catch (error) {
      console.error('Failed to cleanup map image:', error);
      return { success: false, error: error.message, publicId };
    }
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
}

module.exports = new RoomService();