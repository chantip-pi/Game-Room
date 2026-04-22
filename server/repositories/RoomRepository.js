class RoomRepository {
  constructor() {
    this._rooms = new Map();
  }

  // --- Room Management ---

  createRoom(roomCode, roomData) {
    this._rooms.set(roomCode, { 
      createdAt: new Date(), 
      ...roomData 
    });
  }

  roomExists(roomCode) {
    return this._rooms.has(roomCode);
  }

  deleteRoom(roomCode) {
    this._rooms.delete(roomCode);
  }

  getRoomInfo(roomCode) {
    return this._rooms.get(roomCode);
  }

  updateRoomInfo(roomCode, roomData) {
    if (this._rooms.has(roomCode)) {
      this._rooms.set(roomCode, {
        ...this._rooms.get(roomCode),
        ...roomData
      });
    }
  }

  getAllRooms() {
    return Array.from(this._rooms.keys());
  }

  getRoomCount() {
    return this._rooms.size;
  }
}

module.exports = new RoomRepository();