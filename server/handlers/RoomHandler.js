const roomService = require('../services/RoomService');
const { User, Room, Message } = require('../models');

function registerRoomHandlers(io, socket) {
  socket.on('create_room', ({ username, dice, playerCount, turnLimit, mapDataUrl, mapPublicId, profileImage } = {}) => {
    try {
      if (!username || !username.trim()) {
        return socket.emit('error', { message: 'Username is required.' });
      }
      
      if (!mapDataUrl) {
        return socket.emit('error', { message: 'Map image is required to create a room.' });
      }

      // Create user model instance
      const user = new User(username.trim(), socket.id, profileImage);
      
      const roomCode = roomService.createRoom(username, { 
        dice, 
        playerCount, 
        turnLimit, 
        mapDataUrl, 
        mapPublicId, 
        createdBy: username 
      });

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

      // Create and send system message
      const createMessage = Message.createSystemMessage(
        `Room created by ${username}`,
        roomCode
      );
      roomService.addMessage(roomCode, createMessage);
      io.to(roomCode).emit('receive_message', createMessage.toJSON());

      // Broadcast profile image to all users in room
      if (profileImage) {
        io.to(roomCode).emit('user_profile_update', { username, profileImage });
      }

      console.log(`Room ${roomCode} created by ${username}`);
    } catch (error) {
      console.error('Room creation error:', error);
      socket.emit('error', { message: 'Failed to create room.' });
    }
  });

  socket.on('join_room', ({ username, room, profileImage } = {}) => {
    try {
      if (!username || !username.trim() || !room) {
        return socket.emit('error', { message: 'Username and room code are required.' });
      }

      roomService.joinRoom(room, username.trim());

      // Create user model instance
      const user = new User(username.trim(), socket.id, profileImage);

      socket.join(room);
      socket.username = username;
      socket.room = room;

      const users = roomService.getUsersInRoom(room);
      const messageHistory = roomService.getMessageHistory(room);

      socket.to(room).emit('user_joined', { username, timestamp: new Date() });
      io.to(room).emit('update_users', users);
      
      // Send chat history to newly joined user
      socket.emit('chat_history', { messages: messageHistory });
      socket.emit('room_joined', { room });
      
      // Send room info including map data
      const roomInfo = roomService.getRoomInfo(room);
      socket.emit('room_info', roomInfo);

      // Create and send system message for user joining
      const joinMessage = Message.createSystemMessage(
        `${username} has joined the room`,
        room
      );
      roomService.addMessage(room, joinMessage);
      io.to(room).emit('receive_message', joinMessage.toJSON());

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
    } catch (err) {
      console.error('Room join error:', err);
      socket.emit('error', { message: err.message });
    }
  });

  socket.on('leave_room', ({ room, username } = {}) => {
    try {
      if (!room || !username) {
        return socket.emit('error', { message: 'Room and username are required.' });
      }

      // Clean up pawn position before leaving
      roomService.removePawnPosition(room, username);
      
      const result = roomService.leaveRoom(room, username);
      
      socket.leave(room);
      socket.to(room).emit('user_left', { username, timestamp: new Date() });
      
      // Clean up user profile when leaving
      roomService.removeUserProfile(room, username);
      io.to(room).emit('user_profile_remove', { username });
      
      // Broadcast pawn removal to all users in room
      io.to(room).emit('user_left_pawn', { username });
      
      // Create and send system message for user leaving
      const leaveMessage = Message.createSystemMessage(
        `${username} has left the room`,
        room
      );
      
      if (!result.roomDeleted) {
        roomService.addMessage(room, leaveMessage);
        io.to(room).emit('receive_message', leaveMessage.toJSON());
        io.to(room).emit('update_users', result.users);
      }

      console.log(`${username} left room ${room}`);
    } catch (error) {
      console.error('Room leave error:', error);
      socket.emit('error', { message: 'Failed to leave room.' });
    }
  });
}

module.exports = registerRoomHandlers;