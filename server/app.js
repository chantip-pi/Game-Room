const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
 
const registerRoomHandlers = require('./handlers/RoomHandler');
const registerMessageHandlers = require('./handlers/MessageHandler');
const registerDisconnectHandler = require('./handlers/DisconnectHandler');
 
function createApp({ clientOrigin = 'http://localhost:5173' } = {}) {
  const app = express();
  app.use(cors());
 
  const server = http.createServer(app);
 
  const io = new Server(server, {
    cors: { origin: clientOrigin, methods: ['GET', 'POST'] },
  });
 
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
 
    registerRoomHandlers(io, socket);
    registerMessageHandlers(io, socket);
    registerDisconnectHandler(io, socket);
  });
 
  return server;
}
 
module.exports = { createApp };