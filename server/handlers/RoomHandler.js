const roomService = require('../services/RoomService');

function registerRoomHandlers(io, socket) {
  socket.on('create_room', ({ username } = {}) => {
    if (!username) {
      return socket.emit('error', { message: 'Username is required.' });
    }

    const roomCode = roomService.createRoom(username);

    socket.join(roomCode);
    socket.username = username;
    socket.room = roomCode;

    const users = roomService.getUsersInRoom(roomCode);

    socket.emit('room_created', { roomCode });
    socket.emit('update_users', users);
    socket.emit('room_joined', { roomCode });

    console.log(`Room ${roomCode} created by ${username}`);
  });

  socket.on('join_room', ({ username, room } = {}) => {
    if (!username || !room) {
      return socket.emit('error', { message: 'Username and room code are required.' });
    }

    try {
      roomService.joinRoom(room, username);
    } catch (err) {
      return socket.emit('error', { message: err.message });
    }

    socket.join(room);
    socket.username = username;
    socket.room = room;

    const users = roomService.getUsersInRoom(room);
    const messageHistory = roomService.getMessageHistory(room);

    socket.to(room).emit('user_joined', { username });
    io.to(room).emit('update_users', users);
    
    // Send chat history to newly joined user
    socket.emit('chat_history', { messages: messageHistory });
    socket.emit('room_joined', { room });

    console.log(`${username} joined room ${room}`);
  });
}

module.exports = registerRoomHandlers;