import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isLoggedIn, logout, getSession } from '../lib/auth'
import logo from '../assets/logo.png'

const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Join Event', href: '/join' },
  { label: 'Connect',    href: '/connect' },
  { label: 'About',      href: '/#about' },
  { label: 'Privacy',    href: '#privacy', modal: true },
]

function PrivacyModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal privacy-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal glass-btn" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-header">
          <h2>Privacy</h2>
          <p className="modal-subtitle">🐟 We promise we&apos;re not evil fish stealing your data.</p>
        </div>
        <div className="privacy-body">
          <p>Here&apos;s what we actually collect — and it&apos;s not much:</p>
          <ul className="privacy-list">
            <li>🐠 <strong>Your username</strong> — so we know which fish is you in the aquarium.</li>
            <li>🪸 <strong>Event participation</strong> — so we know which aquarium to drop you into.</li>
          </ul>
          <p className="privacy-footer">Questions? We&apos;re just fish. But friendly ones. 🌊</p>
        </div>
      </div>
    </div>
  )
}

export default function Navbar({ dark = false }) {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const session  = loggedIn ? getSession() : null
  const initial  = session?.username?.[0]?.toUpperCase() || '?'
  const [showPrivacy, setShowPrivacy] = useState(false)

  function handleNav(e, link) {
    e.preventDefault()
    if (link.modal && link.label === 'Privacy') {
      setShowPrivacy(true)
      return
    }
    if (link.href.startsWith('/#')) {
      navigate('/')
      setTimeout(() => {
        document.getElementById(link.href.slice(2))?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    } else {
      navigate(link.href)
    }
  }

  function handleLogout() { logout(); navigate('/login') }

  return (
    <>
      <nav className={`navbar${dark ? ' navbar-dark' : ''}`}>
        <img
          src={logo}
          alt="FishNet"
          className="nav-logo-img"
          onClick={() => navigate('/')}
        />

        <ul className="nav-links">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a href={link.href} onClick={(e) => handleNav(e, link)}>
                {link.label}
              </a>
            </li>
          ))}
          {loggedIn && (
            <li>
              <a href="#" onClick={(e) => { e.preventDefault(); handleLogout() }}>Log out</a>
            </li>
          )}
        </ul>

        <button
          className="nav-profile-btn"
          onClick={() => navigate(loggedIn ? '/profile' : '/login')}
          title={loggedIn ? `Profile (${session?.username})` : 'Log in'}
        >
          <div className={`nav-avatar${!loggedIn ? ' nav-avatar-guest' : ''}`}>
            {loggedIn ? initial : '🐟'}
          </div>
        </button>
      </nav>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  )
}
