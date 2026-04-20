const roomService = require('../services/RoomService');

function disconnectHandler(io, socket) {
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    if (socket.room && socket.username) {
      // Clean up pawn position before leaving
      roomService.removePawnPosition(socket.room, socket.username);
      
      const result = roomService.leaveRoom(socket.room, socket.username);
      
      socket.leave(socket.room);
      socket.to(socket.room).emit('user_left', { username: socket.username });
      
      // Clean up user profile when leaving
      roomService.removeUserProfile(socket.room, socket.username);
      io.to(socket.room).emit('user_profile_remove', { username: socket.username });
      
      // Notify about pawn removal
      socket.to(socket.room).emit('user_left_pawn', { username: socket.username });
      
      if (!result.roomDeleted) {
        io.to(socket.room).emit('update_users', result.users);
      }

      console.log(`${socket.username} left room ${socket.room} due to disconnection`);
    }
  });
}

module.exports = disconnectHandler;