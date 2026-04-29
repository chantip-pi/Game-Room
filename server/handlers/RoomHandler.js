const roomService = require('../services/RoomService');
const userService = require('../services/UserService');
const imageService = require('../services/ImageService');
const { Message, User } = require('../models/index');

function registerRoomHandlers(io, socket) {
  // Timer management
  const roomTimers = {}; // Store active timers per room

  socket.on('create_room', ({ username, dice, playerCount, turnLimit, mapDataUrl, mapPublicId, profileImage } = {}) => {
    try {
      // Validate required parameters
      if (!username || !username.trim()) {
        return socket.emit('error', { message: 'Username is required.' });
      }
      
      if (dice === undefined || dice === null) {
        return socket.emit('error', { message: 'Dice setting is required.' });
      }
      
      if (playerCount === undefined || playerCount === null || playerCount < 2 || playerCount > 8) {
        return socket.emit('error', { message: 'Player count must be between 2 and 8.' });
      }
      
      if (turnLimit === undefined || turnLimit === null || turnLimit < 30 || turnLimit > 3600) {
        return socket.emit('error', { message: 'Turn limit must be between 30 seconds and 1 hour.' });
      }
      
      // Map image and profile picture are optional

      const roomCode = roomService.createRoom(username, { 
        dice, 
        playerCount, 
        turnLimit, 
        mapDataUrl, 
        mapPublicId, 
        createdBy: username 
      }, profileImage);

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

      // Broadcast profile image to all users in room (only if it's a Cloudinary URL)
      if (profileImage && !profileImage.startsWith('blob:')) {
        console.log(`Broadcasting profile image for room creator ${username} in room ${roomCode}: ${profileImage}`);
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

    // Always store and broadcast profile state (even if null)
    roomService.setUserProfile(room, trimmedUsername, profileImage || null);
    io.to(room).emit('user_profile_update', { username: trimmedUsername, profileImage: profileImage || null });

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
if (existingProfiles) {
  console.log(`Sending existing profiles to ${trimmedUsername}:`, JSON.stringify(existingProfiles));
  Object.entries(existingProfiles).forEach(([profileUsername, profileImage]) => {
    if (profileUsername !== trimmedUsername && profileImage) {
      socket.emit('user_profile_update', { username: profileUsername, profileImage });
    }
  });
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

  // Timer event handlers
  socket.on('start_timer', ({ room }) => {
    try {
      if (!room) {
        return socket.emit('error', { message: 'Room code is required.' });
      }

      const roomInfo = roomService.getRoomInfo(room);
      if (!roomInfo || !roomInfo.gameSettings.turnLimit) {
        return socket.emit('error', { message: 'No turn limit set for this room.' });
      }

      // Clear existing timer for this room
      if (roomTimers[room]) {
        clearInterval(roomTimers[room].interval);
      }

      const turnLimit = roomInfo.gameSettings.turnLimit;
      let timeLeft = turnLimit;

      // Start new timer
      roomTimers[room] = {
        startTime: Date.now(),
        timeLeft: turnLimit,
        interval: setInterval(() => {
          timeLeft--;
          roomTimers[room].timeLeft = timeLeft;

          // Broadcast timer update to all clients in room
          io.to(room).emit('timer_update', { 
            timeLeft, 
            totalTime: turnLimit,
            isRunning: true 
          });

          // Handle timer end
          if (timeLeft <= 0) {
            clearInterval(roomTimers[room].interval);
            roomTimers[room].isRunning = false;
            
            io.to(room).emit('timer_end', { 
              timeLeft: 0, 
              totalTime: turnLimit,
              isRunning: false 
            });

            // Add system message
            const timeUpMessage = Message.createSystemMessage("Time's up! Turn ended.", room);
            roomService.addMessage(room, timeUpMessage);
            io.to(room).emit('receive_message', timeUpMessage.toJSON());
          }
        }, 1000)
      };

      // Emit initial timer state
      io.to(room).emit('timer_start', { 
        timeLeft: turnLimit, 
        totalTime: turnLimit,
        isRunning: true 
      });

      console.log(`Timer started for room ${room} with ${turnLimit} seconds`);
    } catch (error) {
      console.error('Timer start error:', error);
      socket.emit('error', { message: 'Failed to start timer.' });
    }
  });

  socket.on('stop_timer', ({ room }) => {
    try {
      if (!room) {
        return socket.emit('error', { message: 'Room code is required.' });
      }

      if (roomTimers[room] && roomTimers[room].interval) {
        clearInterval(roomTimers[room].interval);
        roomTimers[room].isRunning = false;

        io.to(room).emit('timer_stop', { 
          timeLeft: roomTimers[room].timeLeft,
          totalTime: roomTimers[room].totalTime || 0,
          isRunning: false 
        });

        console.log(`Timer stopped for room ${room}`);
      }
    } catch (error) {
      console.error('Timer stop error:', error);
      socket.emit('error', { message: 'Failed to stop timer.' });
    }
  });

  socket.on('reset_timer', ({ room }) => {
    try {
      if (!room) {
        return socket.emit('error', { message: 'Room code is required.' });
      }

      const roomInfo = roomService.getRoomInfo(room);
      if (!roomInfo || !roomInfo.gameSettings.turnLimit) {
        return socket.emit('error', { message: 'No turn limit set for this room.' });
      }

      // Clear existing timer
      if (roomTimers[room] && roomTimers[room].interval) {
        clearInterval(roomTimers[room].interval);
      }

      const turnLimit = roomInfo.gameSettings.turnLimit;

      // Reset timer state
      roomTimers[room] = {
        startTime: Date.now(),
        timeLeft: turnLimit,
        totalTime: turnLimit,
        isRunning: false
      };

      io.to(room).emit('timer_reset', { 
        timeLeft: turnLimit, 
        totalTime: turnLimit,
        isRunning: false 
      });

      console.log(`Timer reset for room ${room}`);
    } catch (error) {
      console.error('Timer reset error:', error);
      socket.emit('error', { message: 'Failed to reset timer.' });
    }
  });

  socket.on('get_timer_state', ({ room }) => {
    try {
      if (!room) {
        return socket.emit('error', { message: 'Room code is required.' });
      }

      if (roomTimers[room]) {
        socket.emit('timer_state', {
          timeLeft: roomTimers[room].timeLeft,
          totalTime: roomTimers[room].totalTime || 0,
          isRunning: roomTimers[room].isRunning || false
        });
      } else {
        const roomInfo = roomService.getRoomInfo(room);
        socket.emit('timer_state', {
          timeLeft: roomInfo.gameSettings.turnLimit || 0,
          totalTime: roomInfo.gameSettings.turnLimit || 0,
          isRunning: false
        });
      }
    } catch (error) {
      console.error('Timer state error:', error);
      socket.emit('error', { message: 'Failed to get timer state.' });
    }
  });

  // Clean up timer when socket disconnects
  socket.on('disconnect', () => {
    if (socket.room && roomTimers[socket.room]) {
      clearInterval(roomTimers[socket.room].interval);
      delete roomTimers[socket.room];
      console.log(`Timer cleaned up for room ${socket.room}`);
    }
  });
}

module.exports = registerRoomHandlers;