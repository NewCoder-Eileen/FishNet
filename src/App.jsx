import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JoinEvent from './pages/JoinEvent'
import EventPage from './pages/EventPage'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Connect from './Connect.jsx'
import UserProfile from './pages/UserProfile'
import RequireAuth from './components/RequireAuth'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/join"        element={<RequireAuth><JoinEvent /></RequireAuth>} />
        <Route path="/event/:code" element={<RequireAuth><EventPage /></RequireAuth>} />
        <Route path="/connect"     element={<RequireAuth><Connect /></RequireAuth>} />
        <Route path="/user/:username" element={<UserProfile />} />
      </Routes>
    </BrowserRouter>
  )
}

