const messageService = require('../services/MessageService');

/**
 * Register dice handlers for a socket connection.
 * 
 * @param {object} io - The io object from socket library.
 * @param {object} socket - The socket object.
 */
function registerDiceHandlers(io, socket) {
  socket.on('dice_roll', (data = {}) => {
    const { room, username, type, value, timestamp } = data;

    try {
      // Validate input
      if (!username || !room) {
        return socket.emit('error', { message: 'Username and room are required.' });
      }

      if (!type || !value) {
        return socket.emit('error', { message: 'Dice type and value are required.' });
      }

      // Validate dice type
      const validDiceTypes = ['D6', 'D12', 'D20'];
      if (!validDiceTypes.includes(type)) {
        return socket.emit('error', { message: 'Invalid dice type. Must be D6, D12, or D20.' });
      }

      // Validate dice value range
      const maxValue = type === 'D6' ? 6 : type === 'D12' ? 12 : 20;
      if (value < 1 || value > maxValue) {
        return socket.emit('error', { message: `Invalid dice value for ${type}. Must be between 1 and ${maxValue}.` });
      }

      messageService.validate(socket, room);
      
      // Broadcast dice roll start to all users in room
      io.to(room).emit('dice_roll_start', {
        username,
        type,
        timestamp: new Date().toISOString()
      });

      // Simulate rolling animation time (1 second)
      setTimeout(() => {
        // Broadcast final dice roll result to all users in room
        io.to(room).emit('dice_roll_end', {
          username,
          type,
          value,
          timestamp: timestamp || new Date().toISOString()
        });

        }, 1000);
    } catch (err) {
      return socket.emit('error', { message: err.message });
    }
  });
}

module.exports = registerDiceHandlers;
