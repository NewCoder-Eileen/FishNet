import { BrowserRouter, Routes, Route } from 'react-router-dom'
import JoinEvent from './pages/JoinEvent'
import EventPage from './pages/EventPage'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Connect from './Connect.jsx'
import RequireAuth from './components/RequireAuth'
import FishnetHome from './app/App.jsx'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<FishnetHome />} />
        <Route path="/login"       element={<Login />} />
        <Route path="/profile"     element={<Profile />} />
        <Route path="/join"        element={<RequireAuth><JoinEvent /></RequireAuth>} />
        <Route path="/event/:code" element={<RequireAuth><EventPage /></RequireAuth>} />
        <Route path="/connect"     element={<RequireAuth><Connect /></RequireAuth>} />
      </Routes>
    </BrowserRouter>
  )
}

