const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const multer = require('multer');

const registerRoomHandlers = require('./handlers/RoomHandler');
const registerMessageHandlers = require('./handlers/MessageHandler');
const registerDisconnectHandler = require('./handlers/DisconnectHandler');
const pawnHandler = require('./handlers/PawnHandler');
const registerDiceHandlers = require('./handlers/DiceHandler');

// REST endpoint for room validation
async function validateRoom(req, res) {
  try {
    const { roomCode } = req.body;
    
    if (!roomCode) {
      return res.status(400).json({ error: 'Room code is required' });
    }

    const roomService = require('./services/RoomService');
    const roomRepository = require('./repositories/RoomRepository');
    
    const exists = roomRepository.roomExists(roomCode.trim().toUpperCase());
    
    if (exists) {
      const roomInfo = roomService.getRoomInfo(roomCode.trim().toUpperCase());
      const userCount = roomService.getUsersInRoom(roomCode.trim().toUpperCase()).length;
      const maxPlayers = roomInfo.gameSettings.playerCount || 4;
      const turnLimit = roomInfo.gameSettings.turnLimit || 60;
      
      res.json({
        exists: true,
        roomCode: roomCode.trim().toUpperCase(),
        userCount: userCount,
        maxPlayers: maxPlayers,
        turnLimit: turnLimit,
        isFull: userCount >= maxPlayers
      });
    } else {
      res.json({
        exists: false,
        roomCode: roomCode.trim().toUpperCase()
      });
    }
  } catch (error) {
    console.error('Room validation error:', error);
    res.status(500).json({ error: 'Failed to validate room' });
  }
}

// REST endpoint for profile upload without room context
async function uploadProfileImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }

    const imageService = require('./services/ImageService');
    
    // Validate file
    const buffer = req.file.buffer;
    imageService.validateImageSize(buffer);
    
    const mimetype = req.file.mimetype;
    await imageService.validateFileContent(buffer, mimetype);
    
    // Upload to Cloudinary with username as public ID
    const result = await imageService.uploadToCloudinary(
      buffer,
      req.file.originalname,
      'temp-profiles', // Temporary folder, will be moved to room folder later
      { overwrite: true, unique_filename: false }
    );

    console.log(`Profile image uploaded for ${username}: ${result.secure_url}`);
    
    res.json({
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      username: username
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload profile image' });
  }
}

function createApp({ clientOrigin = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:64892', 'http://127.0.0.1:64892'] } = {}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Use memory storage for multer
  const upload = multer({ storage: multer.memoryStorage() });
  app.post('/validate-room', validateRoom);
  app.post('/profile-image', upload.single('image'), uploadProfileImage);

  const server = http.createServer(app);
 
  const io = new Server(server, {
    cors: { 
      origin: clientOrigin, 
      methods: ['GET', 'POST'],
      credentials: true
    },
  });
 
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
 
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    pawnHandler(io, socket);
    registerDiceHandlers(io, socket);
    registerDisconnectHandler(io, socket);
  });
 
  return server;
}

module.exports = { createApp };