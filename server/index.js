require('dotenv').config();
const { createApp } = require('./app');
 
const PORT = process.env.PORT || 3001;
 
const server = createApp({
  clientOrigin: process.env.CLIENT_ORIGIN || 'https://game-room-xi.vercel.app',
});
 
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});