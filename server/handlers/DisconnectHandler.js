const roomService = require('../services/RoomService');
const imageService = require('../services/ImageService');
const pawnService = require('../services/PawnService');
const { Message } = require('../models/index');

function registerDisconnectHandlers(io, socket) {
  socket.on('disconnect', () => {
    try {
      const username = socket.username;
      const room = socket.room;

      if (!username || !room) {
        return;
      }

      console.log(`User disconnected: ${socket.id}`);

      // For now, we'll use a simple timeout approach to detect page refresh
      // If user reconnects within 5 seconds, it's likely a page refresh
      setTimeout(() => {
        // Check if user has reconnected
        const roomUsers = roomService.getUsersInRoom(room);
        const userStillInRoom = roomUsers.some(user => user.username === username && user.isActive);

        if (userStillInRoom) {
          console.log(`User ${username} reconnected - likely page refresh, no cleanup needed`);
          return;
        }

        // User didn't reconnect, proceed with cleanup
        console.log(`User ${username} did not reconnect - cleaning up`);

        // Clean up pawn position
        pawnService.removePawnPosition(room, username);

        // Remove user from room
        const result = roomService.leaveRoom(room, username);

        // Clean up user profile when disconnecting
        imageService.cleanupUser(username);

        socket.to(room).emit('user_left', { username, timestamp: new Date() });

        // Broadcast pawn removal to all users in room
        io.to(room).emit('user_left_pawn', { username });

        // Clean up user profile when leaving
        io.to(room).emit('user_profile_remove', { username });

        // Create and send system message for user leaving
        const leaveMessage = Message.createSystemMessage(
          `${username} left room ${room} due to disconnection`,
          room
        );

        if (!result.roomDeleted) {
          roomService.addMessage(room, leaveMessage);
          io.to(room).emit('receive_message', leaveMessage.toJSON());
          io.to(room).emit('update_users', result.users);
        }

        console.log(`${username} left room ${room} due to disconnection`);
      }, 5000); // 5 second delay to detect reconnection

    } catch (error) {
      console.error('Disconnect handler error:', error);
    }
  });
}

module.exports = registerDisconnectHandlers;