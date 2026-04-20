const roomRepository = require('../repositories/RoomRepository');
const { generateRoomCode } = require('../utils/generateRoomCode');

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
      roomRepository.deleteRoom(roomCode);
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
}

module.exports = new RoomService();