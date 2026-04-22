const roomService = require('../services/RoomService');
const imageService = require('../services/ImageService');
const { Message } = require('../models/index');

function disconnectHandler(io, socket) {
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);

    if (socket.room && socket.username) {
      try {
        // Create system message for user leaving
        const leaveMessage = Message.createSystemMessage(
          `${socket.username} has left the room`,
          socket.room
        );
        
        // Clean up pawn position before leaving
        roomService.removePawnPosition(socket.room, socket.username);
        
        const result = roomService.leaveRoom(socket.room, socket.username);
        
        socket.leave(socket.room);
        
        // Notify other users
        socket.to(socket.room).emit('user_left', { 
          username: socket.username,
          timestamp: new Date()
        });
        
        // Clean up user profile when leaving
        roomService.removeUserProfile(socket.room, socket.username);
        io.to(socket.room).emit('user_profile_remove', { username: socket.username });
        
        // Notify about pawn removal
        socket.to(socket.room).emit('user_left_pawn', { username: socket.username });
        
        // Add system message
        roomService.addMessage(socket.room, leaveMessage);
        io.to(socket.room).emit('receive_message', leaveMessage.toJSON());
        
        if (!result.roomDeleted) {
          io.to(socket.room).emit('update_users', result.users);
        }

        // Cleanup user images from ImageService
        imageService.cleanupUser(socket.username);

        console.log(`${socket.username} left room ${socket.room} due to disconnection`);
      } catch (error) {
        console.error(`Error handling disconnect for ${socket.username}:`, error);
      }
    }
  });
}

module.exports = disconnectHandler;