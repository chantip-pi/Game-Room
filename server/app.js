const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
 
const registerRoomHandlers = require('./handlers/RoomHandler');
const registerMessageHandlers = require('./handlers/MessageHandler');
const registerDisconnectHandler = require('./handlers/DisconnectHandler');
const pawnHandler = require('./handlers/PawnHandler');
 
function createApp({ clientOrigin = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:64892', 'http://127.0.0.1:64892'] } = {}) {
  const app = express();
  app.use(cors());
 
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
    registerDisconnectHandler(io, socket);
  });
 
  return server;
}

module.exports = { createApp };