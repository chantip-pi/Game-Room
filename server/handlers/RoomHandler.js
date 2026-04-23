const roomService = require('../services/RoomService');
const userService = require('../services/UserService');
const imageService = require('../services/ImageService');
const { Message, User } = require('../models/index');

function registerRoomHandlers(io, socket) {
  socket.on('create_room', ({ username, dice, playerCount, turnLimit, mapDataUrl, mapPublicId, profileImage } = {}) => {
    try {
      if (!username || !username.trim()) {
        return socket.emit('error', { message: 'Username is required.' });
      }
      
      // Map image is now optional - will be uploaded separately

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
      // Ensure mapDataUrl is set for frontend compatibility
      const roomInfoForFrontend = {
        ...roomInfo,
        mapDataUrl: roomInfo.mapImage || roomInfo.gameSettings?.mapDataUrl
      };
      socket.emit('room_info', roomInfoForFrontend);

      // Create and send system message
      const createMessage = Message.createSystemMessage(
        `Room created by ${username}`,
        roomCode
      );
      roomService.addMessage(roomCode, createMessage);
      io.to(roomCode).emit('receive_message', createMessage.toJSON());

      // Store and broadcast profile image to all users in room (only if it's a Cloudinary URL)
      if (profileImage && !profileImage.startsWith('blob:')) {
        console.log(`Setting profile image for room creator ${username} in room ${roomCode}: ${profileImage}`);
        roomService.setUserProfile(roomCode, username, profileImage);
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
    if (!username?.trim() || !room) {
      return socket.emit('error', { message: 'Username and room code are required.' });
    }

    const trimmedUsername = username.trim();
    const isNewUser = !userService.userExistsInRoom(room, trimmedUsername);

    if (isNewUser) {
      users = userService.joinRoom(room, trimmedUsername, socket.id, profileImage);
    } else {
      userService.updateUserSocket(room, trimmedUsername, socket.id);
      users = userService.getUsersInRoom(room);
    }

    // Always re-join the socket.io room channel (handles reconnections)
    socket.join(room);
    
    // Set socket properties for message validation and other handlers
    socket.room = room;
    socket.username = trimmedUsername;

    if (profileImage) {
      userService.setUserProfile(room, trimmedUsername, profileImage);
      roomService.setUserProfile(room, trimmedUsername, profileImage);
      io.to(room).emit('user_profile_update', { username: trimmedUsername, profileImage });
    }

    if (isNewUser) {
      console.log(`Emitting user_joined event for ${trimmedUsername} to room ${room}`);
      socket.to(room).emit('user_joined', { username: trimmedUsername, timestamp: new Date() });
    }

    io.to(room).emit('update_users', users);

    const roomInfo = roomService.getRoomInfo(room);
    socket.emit('room_joined', { room });
    
    // Add null check for roomInfo to prevent error on page refresh
    const roomInfoForFrontend = roomInfo ? {
      ...roomInfo,
      mapDataUrl: roomInfo.mapImage || roomInfo.gameSettings?.mapDataUrl
    } : {
      mapDataUrl: null
    };
    
    socket.emit('room_info', roomInfoForFrontend);
    socket.emit('chat_history', { messages: roomService.getMessageHistory(room) });

    const existingProfiles = roomService.getUserProfiles(room);
    if (existingProfiles && Object.keys(existingProfiles).length > 0) {
      socket.emit('existing_user_profiles', { profiles: existingProfiles });
    }

    // Send existing pawn positions to restore positions after refresh
    const existingPawnPositions = roomService.getPawnPositions(room);
    if (existingPawnPositions && Object.keys(existingPawnPositions).length > 0) {
      const pawnPositionsForSocket = {};
      Object.entries(existingPawnPositions).forEach(([username, pawn]) => {
        if (pawn.position) {
          pawnPositionsForSocket[username] = pawn.position;
        }
      });
      socket.emit('existing_pawn_positions', { positions: pawnPositionsForSocket });
    }

    const joinMessage = Message.createSystemMessage(`${trimmedUsername} has joined the room`, room);
    roomService.addMessage(room, joinMessage);
    io.to(room).emit('receive_message', joinMessage.toJSON());

    console.log(`${trimmedUsername} joined room ${room}`);
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

  // Handle profile image upload
  socket.on('upload_profile_image', async ({ imageData, filename, mimetype } = {}) => {
    try {
      if (!socket.username || !socket.room) {
        return socket.emit('error', { message: 'You must be in a room to upload a profile image.' });
      }

      if (!imageData || !filename || !mimetype) {
        return socket.emit('error', { message: 'Image data, filename, and mimetype are required.' });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(imageData.split(',')[1], 'base64');
      
      // Validate image size
      imageService.validateImageSize(buffer);

      // Upload profile image
      const profileData = await imageService.uploadUserProfile(
        socket.username,
        socket.room,
        buffer,
        filename,
        mimetype
      );

      // Update user profile in room service
      roomService.setUserProfile(socket.room, socket.username, profileData.url);

      // Broadcast profile update to room
      console.log(`Broadcasting profile update for ${socket.username} to room ${socket.room}: ${profileData.url}`);
      io.to(socket.room).emit('user_profile_update', { 
        username: socket.username, 
        profileImage: profileData.url 
      });

      socket.emit('profile_image_uploaded', { 
        url: profileData.url,
        filename: profileData.publicId.split('/').pop()
      });

      console.log(`Profile image uploaded for ${socket.username} in room ${socket.room}`);
    } catch (error) {
      console.error('Profile image upload error:', error);
      socket.emit('error', { message: error.message || 'Failed to upload profile image.' });
    }
  });

  // Handle map image upload (room creator only)
  socket.on('upload_map_image', async ({ imageData, filename, mimetype } = {}) => {
    try {
      if (!socket.username || !socket.room) {
        return socket.emit('error', { message: 'You must be in a room to upload a map image.' });
      }

      if (!imageData || !filename || !mimetype) {
        return socket.emit('error', { message: 'Image data, filename, and mimetype are required.' });
      }

      // Check if user is room creator
      const roomInfo = roomService.getRoomInfo(socket.room);
      if (!roomInfo || roomInfo.createdBy !== socket.username) {
        return socket.emit('error', { message: 'Only room creator can upload map images.' });
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(imageData.split(',')[1], 'base64');
      
      // Validate image size
      imageService.validateImageSize(buffer);

      // Upload map image
      const mapData = await imageService.uploadMapImage(
        socket.room,
        socket.username,
        buffer,
        filename,
        mimetype
      );

      // Update room settings with map image URL
      roomService.updateRoomSettings(socket.room, {
        mapDataUrl: mapData.url,
        mapPublicId: mapData.publicId
      });

      // Broadcast map update to room
      io.to(socket.room).emit('map_image_updated', { 
        url: mapData.url,
        filename: mapData.publicId.split('/').pop()
      });

      socket.emit('map_image_uploaded', { 
        roomCode: socket.room,
        url: mapData.url,
        filename: mapData.publicId.split('/').pop()
      });

    } catch (error) {
      console.error('Map image upload error:', error);
      socket.emit('error', { message: error.message || 'Failed to upload map image.' });
    }
  });
}

module.exports = registerRoomHandlers;