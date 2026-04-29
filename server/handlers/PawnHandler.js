const pawnService = require('../services/PawnService');
const { Pawn } = require('../models/index');

const pawnHandler = (io, socket) => {
  // Handle pawn position updates
  socket.on("pawn_position", (data) => {
    const { room, username, position } = data;
    
    try {
      // Validate data
      if (!room || !username || !position) {
        console.error('Invalid pawn position data:', data);
        return socket.emit('error', { message: 'Invalid pawn position data.' });
      }

      // Validate position format
      if (typeof position.x !== 'number' || typeof position.y !== 'number') {
        return socket.emit('error', { message: 'Position must contain valid x and y coordinates.' });
      }

      // Create pawn model instance
      const pawn = new Pawn(username, position);
      
      // Store pawn position in pawn service
      pawnService.updatePawnPosition(room, username, position);
      
      // Broadcast to all users in the room except sender
      socket.to(room).emit("pawn_position_update", {
        username,
        position: pawn.position,
        color: pawn.color,
        lastMoved: pawn.lastMoved
      });
      
    } catch (error) {
      console.error('Pawn position update error:', error);
      socket.emit('error', { message: 'Failed to update pawn position.' });
    }
  });

  // Handle pawn color updates
  socket.on("pawn_color", (data) => {
    const { room, username, color } = data;
    
    try {
      if (!room || !username || !color) {
        return socket.emit('error', { message: 'Invalid pawn color data.' });
      }

      const pawn = new Pawn(username);
      pawn.setColor(color);
      
      // Broadcast color update to room
      io.to(room).emit("pawn_color_update", {
        username,
        color
      });
      
      console.log(`Pawn color updated for ${username} in room ${room}:`, color);
    } catch (error) {
      console.error('Pawn color update error:', error);
      socket.emit('error', { message: 'Failed to update pawn color.' });
    }
  });
};

module.exports = pawnHandler;
