import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './Home.jsx'
import GameRoom from './GameRoom.jsx'
import CreateRoom from './CreateRoom.jsx'
import UserSetting from './UserSetting.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gameroom" element={<GameRoom />} />
        <Route path="/createroom" element={<CreateRoom />} />
        <Route path="/usersetting" element={<UserSetting />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
