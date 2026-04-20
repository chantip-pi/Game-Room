const roomService = require('../services/RoomService');

const pawnHandler = (io, socket) => {
  // Handle pawn position updates
  socket.on("pawn_position", (data) => {
    const { room, username, position } = data;
    
    // Validate data
    if (!room || !username || !position) {
      console.error('Invalid pawn position data:', data);
      return;
    }
    
    // Store pawn position in room service
    roomService.updatePawnPosition(room, username, position);
    
    // Broadcast to all users in the room except sender
    socket.to(room).emit("pawn_position_update", {
      username,
      position
    });
    
    console.log(`Pawn position updated for ${username} in room ${room}:`, position);
  });
};

module.exports = pawnHandler;
