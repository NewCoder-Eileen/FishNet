import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JoinEvent from './pages/JoinEvent'
import EventPage from './pages/EventPage'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Connect from './Connect.jsx'
import UserProfile from './pages/UserProfile'
import Messages from './pages/Messages'
import RequireAuth from './components/RequireAuth'
import { startBgMusic, playClick, toggleMute, getMuted } from './lib/audio'
import './App.css'

function MusicToggle() {
  const [muted, setMuted] = useState(getMuted)
  function handle() {
    const next = toggleMute()
    setMuted(next)
  }
  return (
    <button
      className="music-toggle-btn"
      onClick={handle}
      title={muted ? 'Unmute music' : 'Mute music'}
      aria-label={muted ? 'Unmute music' : 'Mute music'}
    >
      {muted ? '🔇' : '🎵'}
    </button>
  )
}

function AudioManager() {
  useEffect(() => {
    function handleClick(e) {
      // Start background music on very first interaction (browser policy)
      startBgMusic()
      // Play click sound for any button/link — skips if element opts out
      const btn = e.target.closest('button, a[href], [role="button"]')
      if (btn && !btn.dataset.noSound) playClick()
    }
    document.addEventListener('click', handleClick, { passive: true })
    return () => document.removeEventListener('click', handleClick)
  }, [])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AudioManager />
      <MusicToggle />
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/join"        element={<RequireAuth><JoinEvent /></RequireAuth>} />
        <Route path="/event/:code" element={<RequireAuth><EventPage /></RequireAuth>} />
        <Route path="/connect"     element={<RequireAuth><Connect /></RequireAuth>} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/messages"       element={<RequireAuth><Messages /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}
