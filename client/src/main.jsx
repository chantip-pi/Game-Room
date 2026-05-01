import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Home from './Home.jsx'
import GameRoom from './GameRoom.jsx'
import CreateRoom from './CreateRoom.jsx'
import UserSettings from './UserSettings.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gameroom" element={<GameRoom />} />
        <Route path="/createroom" element={<CreateRoom />} />
        <Route path="/usersettings" element={<UserSettings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
