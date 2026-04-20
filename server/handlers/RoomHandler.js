const roomService = require('../services/RoomService');

function registerRoomHandlers(io, socket) {
  socket.on('create_room', ({ username, dice, playerCount, turnLimit, mapDataUrl, mapPublicId, profileImage } = {}) => {
    if (!username) {
      return socket.emit('error', { message: 'Username is required.' });
    }
    
    if (!mapDataUrl) {
      return socket.emit('error', { message: 'Map image is required to create a room.' });
    }

    const roomCode = roomService.createRoom(username, { dice, playerCount, turnLimit, mapDataUrl, mapPublicId, profileImage });

    socket.join(roomCode);
    socket.username = username;
    socket.room = roomCode;

    const users = roomService.getUsersInRoom(roomCode);

    socket.emit('room_created', { roomCode });
    socket.emit('update_users', users);
    socket.emit('room_joined', { roomCode });
    
    // Send room info including map data to creator
    const roomInfo = roomService.getRoomInfo(roomCode);
    socket.emit('room_info', roomInfo);

    // Broadcast profile image to all users in room
    if (profileImage) {
      io.to(roomCode).emit('user_profile_update', { username, profileImage });
    }

    console.log(`Room ${roomCode} created by ${username}`);
  });

  socket.on('join_room', ({ username, room, profileImage } = {}) => {
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
    
    // Send room info including map data
    const roomInfo = roomService.getRoomInfo(room);
    socket.emit('room_info', roomInfo);

    // Broadcast profile image to all users in room
    if (profileImage) {
      roomService.setUserProfile(room, username, profileImage);
      io.to(room).emit('user_profile_update', { username, profileImage });
    }

    // Send existing user profiles to new user
    const existingProfiles = roomService.getUserProfiles(room);
    if (existingProfiles && Object.keys(existingProfiles).length > 0) {
      socket.emit('existing_user_profiles', { profiles: existingProfiles });
    }

    console.log(`${username} joined room ${room}`);
  });

  socket.on('leave_room', ({ room, username } = {}) => {
    if (!room || !username) {
      return socket.emit('error', { message: 'Room and username are required.' });
    }

    const result = roomService.leaveRoom(room, username);
    
    socket.leave(room);
    socket.to(room).emit('user_left', { username });
    
    // Clean up user profile when leaving
    roomService.removeUserProfile(room, username);
    io.to(room).emit('user_profile_remove', { username });
    
    if (!result.roomDeleted) {
      io.to(room).emit('update_users', result.users);
    }

    console.log(`${username} left room ${room}`);
  });
}

module.exports = registerRoomHandlers;