const messageService = require('../services/MessageService');
const roomService = require('../services/RoomService');

function registerMessageHandlers(io, socket) {
  socket.on('send_message', (data = {}) => {
    const { room, message, username, timestamp } = data;

    try {
      messageService.validate(socket, room);
    } catch (err) {
      return socket.emit('error', { message: err.message });
    }

    const payload = messageService.build({ message, username, timestamp, room });
    
    // Store message in repository
    roomService.addMessage(room, payload);
    
    // Broadcast to all users in room
    io.to(room).emit('receive_message', payload);

    console.log(`[${room}] ${username}: ${message}`);
  });
}

module.exports = registerMessageHandlers;