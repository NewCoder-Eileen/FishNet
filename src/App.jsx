import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Connect from './Connect.jsx'

const NAV_BUTTONS = [
  { label: 'Profile',    graphic: null },
  { label: 'Join Event', graphic: null },
  { label: 'Connect',    graphic: null },
]

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        {null ?? <div className="nav-logo-placeholder">Logo</div>}
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li><Link to="/join-event">Join Event</Link></li>
        <li><Link to="/connect">Connect</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/privacy">Privacy</Link></li>
      </ul>
    </nav>
  )
}

function Home() {
  return (
    <main>
      <section className="hero">
        <div className="hero-logo-placeholder">Your Logo Here</div>
      </section>
    </main>
  )
}

function About() {
  return (
    <main>
      <section className="about-section">
        <h2>About</h2>
        <p>Tell your story here — what is fishnet, who is it for, and what makes it different.</p>
      </section>
    </main>
  )
}

function JoinEvent() {
  return (
    <main>
      <section className="btn-section">
        <div className="btn-grid">
          {NAV_BUTTONS.map((btn, i) => (
            <Jellyfish key={btn.label} {...btn} delay={i * 0.8} />
          ))}
        </div>
      </section>
    </main>
  )
}

function Privacy() {
  return (
    <main>
      <section className="privacy-section">
        <h2>Privacy</h2>
        <p>Your privacy policy goes here.</p>
      </section>
    </main>
  )
}

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<div>Profile Page (Coming Soon)</div>} />
        <Route path="/join-event" element={<JoinEvent />} />
        <Route path="/connect" element={<Connect />} />
        <Route path="/about" element={<About />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </Router>
  )
}

export default App