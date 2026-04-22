const messageService = require('../services/MessageService');
const { Message } = require('../models');

function registerMessageHandlers(io, socket) {
  socket.on('send_message', (data = {}) => {
    const { room, message, username } = data;

    try {
      // Validate input
      if (!message || !message.trim()) {
        return socket.emit('error', { message: 'Message content is required.' });
      }

      if (!username || !room) {
        return socket.emit('error', { message: 'Username and room are required.' });
      }

      messageService.validate(socket, room);
      
      // Create message using model
      const newMessage = new Message(message.trim(), username, room);
      
      // Store message in repository
      messageService.addMessage(room, newMessage.toJSON());
      
      // Broadcast to all users in room
      io.to(room).emit('receive_message', newMessage.toJSON());

      console.log(`[${room}] ${username}: ${message}`);
    } catch (err) {
      console.error('Message handling error:', err);
      return socket.emit('error', { message: err.message });
    }
  });
}

module.exports = registerMessageHandlers;