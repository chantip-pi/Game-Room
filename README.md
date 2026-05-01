# Game Room

A real-time multiplayer game room application built with React and Node.js, featuring WebSocket communication for interactive gameplay.
Created to study about Socket.IO

## Features

- **Real-time multiplayer gaming** with Socket.IO
- **Room creation and management** with customizable settings
- **User profiles** with image upload support
- **Interactive game board** with zoomable maps
- **Chat system** for player communication
- **Dice rolling mechanics** with multiple dice types
- **Turn-based gameplay** with timer functionality
- **Pawn movement** and positioning system

## Live Demo

**Frontend URL:** https://game-room-xi.vercel.app/

## Project Structure

```
socket/
client/                 # React frontend
  src/
    components/         # Reusable UI components
    utils/             # Utility functions and socket manager
    Home.jsx           # Landing page
    GameRoom.jsx       # Main game interface
    UserSettings.jsx   # User configuration
    CreateRoom.jsx     # Room creation
  public/              # Static assets
server/                # Node.js backend
  handlers/           # Socket event handlers
  services/           # Business logic services
  repositories/       # Data access layer
  utils/              # Server utilities
```

## Technology Stack

### Frontend
- **React 19** with modern hooks
- **Vite** for fast development and building
- **React Router** for navigation
- **Socket.IO Client** for real-time communication
- **TailwindCSS** for styling
- **React Icons** for UI icons
- **React-Konva** for canvas-based game elements

### Backend
- **Node.js** with Express
- **Socket.IO** for WebSocket connections
- **Multer** for file uploads
- **Cloudinary** for image storage
- **CORS** for cross-origin requests

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
npm install
npm start
```

## Game Features

### Room Settings
- **Player count:** 4-8 players
- **Dice types:** D6, D12, D20
- **Turn timer:** Customizable time limits
- **Map upload:** Support for custom game boards

### In-Game Features
- **Real-time chat** with all players
- **Interactive dice rolling**
- **Pawn movement** on the game board
- **Turn management** with visual timers
- **Zoom and pan** for detailed map viewing

## Socket Events

### Client to Server
- `join-room` - Join a game room
- `leave-room` - Leave current room
- `chat-message` - Send chat message
- `pawn-position` - Update pawn position
- `roll-dice` - Roll dice
- `start-timer` - Start turn timer
- `stop-timer` - Stop turn timer

### Server to Client
- `room-joined` - Successfully joined room
- `user-joined` - New user joined
- `user-left` - User left room
- `chat-message` - Receive chat message
- `pawn-position-update` - Pawn position changed
- `dice-result` - Dice roll result
- `timer-update` - Timer countdown
- `timer-expired` - Timer finished

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review the console logs for detailed error information
