const messageService = require('../services/MessageService');
const { Message } = require('../models/index');

/**
 * Register message handlers for a socket connection.
 * 
 * @param {object} io - The io object from the socket library.
 * @param {object} socket - The socket object.
 */
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

          } catch (err) {
            return socket.emit('error', { message: err.message });
    }
  });
}

module.exports = registerMessageHandlers;