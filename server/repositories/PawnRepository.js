class PawnRepository {
  constructor() {
    this._pawnPositions = new Map();
  }

  updatePawnPosition(roomCode, username, position) {
    if (!this._pawnPositions.has(roomCode)) {
      this._pawnPositions.set(roomCode, new Map());
    }
    this._pawnPositions.get(roomCode).set(username, position);
  }

  getPawnPosition(roomCode, username) {
    const roomPawns = this._pawnPositions.get(roomCode);
    return roomPawns ? roomPawns.get(username) : null;
  }

  getPawnPositions(roomCode) {
    const roomPawns = this._pawnPositions.get(roomCode);
    return roomPawns ? Object.fromEntries(roomPawns) : {};
  }

  removePawnPosition(roomCode, username) {
    const roomPawns = this._pawnPositions.get(roomCode);
    if (roomPawns) {
      roomPawns.delete(username);
      // Clean up empty room entries
      if (roomPawns.size === 0) {
        this._pawnPositions.delete(roomCode);
      }
    }
  }

  getPawnCount(roomCode) {
    const roomPawns = this._pawnPositions.get(roomCode);
    return roomPawns ? roomPawns.size : 0;
  }

  cleanupRoom(roomCode) {
    this._pawnPositions.delete(roomCode);
  }
}

module.exports = new PawnRepository();
