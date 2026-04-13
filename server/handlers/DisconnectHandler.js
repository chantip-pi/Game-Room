const roomService = require('../services/RoomService');

function registerDisconnectHandler(io, socket) {
  socket.on('disconnect', () => {
    const { username, room } = socket;

    if (username && room) {
      const result = roomService.leaveRoom(room, username);

      if (result.roomDeleted) {
        console.log(`Room ${room} deleted (empty).`);
      } else {
        socket.to(room).emit('user_left', { username });
        io.to(room).emit('update_users', result.users);
      }

      console.log(`${username} left room ${room}`);
    }

    console.log(`User disconnected: ${socket.id}`);
  });
}

module.exports = registerDisconnectHandler;