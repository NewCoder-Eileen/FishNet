import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import JoinEvent from './pages/JoinEvent'
import EventPage from './pages/EventPage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Home />} />
        <Route path="/join"        element={<JoinEvent />} />
        <Route path="/event/:code" element={<EventPage />} />
      </Routes>
    </BrowserRouter>
  )
}