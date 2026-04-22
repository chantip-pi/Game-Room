const pawnRepository = require('../repositories/PawnRepository');
const { Pawn } = require('../models/index');


class PawnService {
  constructor() {
    this.pawnRepository = pawnRepository;
  }

  updatePawnPosition(roomCode, username, position, color = null) {
    // Create pawn model instance
    const pawn = new Pawn(username, position, color);
    
    // Store pawn data
    this.pawnRepository.updatePawnPosition(roomCode, username, pawn.toJSON());
    
    return pawn;
  }

  getPawnPosition(roomCode, username) {
    const pawnData = this.pawnRepository.getPawnPosition(roomCode, username);
    if (pawnData) {
      return Pawn.fromJSON(pawnData);
    }
    return null;
  }

  getPawnPositions(roomCode) {
    const pawnPositions = this.pawnRepository.getPawnPositions(roomCode);
    
    // Convert to Pawn models if needed
    const result = {};
    Object.entries(pawnPositions).forEach(([username, pawnData]) => {
      if (pawnData.username && pawnData.position) {
        result[username] = Pawn.fromJSON(pawnData);
      } else {
        result[username] = pawnData;
      }
    });
    
    return result;
  }

  // Get pawn positions as plain objects for socket emission
  getPawnPositionsForSocket(roomCode) {
    return this.pawnRepository.getPawnPositions(roomCode);
  }

  removePawnPosition(roomCode, username) {
    const pawn = this.getPawnPosition(roomCode, username);
    if (pawn) {
      pawn.deactivate();
    }
    
    this.pawnRepository.removePawnPosition(roomCode, username);
    return pawn;
  }

  // Update pawn color
  updatePawnColor(roomCode, username, color) {
    const pawn = this.getPawnPosition(roomCode, username);
    if (pawn) {
      pawn.setColor(color);
      this.pawnRepository.updatePawnPosition(roomCode, username, pawn.toJSON());
      return pawn;
    }
    
    // Create new pawn with color if doesn't exist
    const newPawn = new Pawn(username, { x: 0, y: 0 }, color);
    this.pawnRepository.updatePawnPosition(roomCode, username, newPawn.toJSON());
    return newPawn;
  }

  // Get all active pawns
  getActivePawns(roomCode) {
    const pawnPositions = this.getPawnPositions(roomCode);
    const activePawns = {};
    
    Object.entries(pawnPositions).forEach(([username, pawn]) => {
      if (pawn.isActive) {
        activePawns[username] = pawn;
      }
    });
    
    return activePawns;
  }

  // Validate position
  validatePosition(position) {
    if (!position || typeof position !== 'object') {
      throw new Error('Position must be an object with x and y coordinates.');
    }
    
    if (typeof position.x !== 'number' || typeof position.y !== 'number') {
      throw new Error('Position x and y must be numbers.');
    }
    
    if (!isFinite(position.x) || !isFinite(position.y)) {
      throw new Error('Position coordinates must be finite numbers.');
    }
    
    return position;
  }

  // Calculate distance between two pawns
  calculateDistance(roomCode, username1, username2) {
    const pawn1 = this.getPawnPosition(roomCode, username1);
    const pawn2 = this.getPawnPosition(roomCode, username2);
    
    if (!pawn1 || !pawn2) {
      throw new Error('Both pawns must exist to calculate distance.');
    }
    
    return pawn1.getDistance(pawn2);
  }

  // Get pawns within range
  getPawnsInRange(roomCode, username, range) {
    const centerPawn = this.getPawnPosition(roomCode, username);
    if (!centerPawn) {
      return {};
    }
    
    const allPawns = this.getActivePawns(roomCode);
    const nearbyPawns = {};
    
    Object.entries(allPawns).forEach(([otherUsername, pawn]) => {
      if (otherUsername !== username) {
        const distance = centerPawn.getDistance(pawn);
        if (distance <= range) {
          nearbyPawns[otherUsername] = pawn;
        }
      }
    });
    
    return nearbyPawns;
  }

  getPawnCount(roomCode) {
    return this.pawnRepository.getPawnCount(roomCode);
  }

  // Get active pawn count
  getActivePawnCount(roomCode) {
    const activePawns = this.getActivePawns(roomCode);
    return Object.keys(activePawns).length;
  }

  // Cleanup room
  cleanupRoom(roomCode) {
    this.pawnRepository.cleanupRoom(roomCode);
  }
}

module.exports = new PawnService();
