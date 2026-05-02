import { useNavigate } from 'react-router-dom'
import { isLoggedIn, logout, getSession } from '../lib/auth'
import logo from '../assets/logo.png'

const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Join Event', href: '/join' },
  { label: 'Connect',    href: '/connect' },
  { label: 'About',      href: '/#about' },
  { label: 'Privacy',    href: '/#privacy' },
]

export default function Navbar({ dark = false }) {
  const navigate = useNavigate()
  const loggedIn = isLoggedIn()
  const session  = loggedIn ? getSession() : null
  const initial  = session?.username?.[0]?.toUpperCase() || '?'

  function handleNav(e, href) {
    e.preventDefault()
    if (href.startsWith('/#')) {
      navigate('/')
      setTimeout(() => {
        document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    } else {
      navigate(href)
    }
  }

  function handleLogout() { logout(); navigate('/login') }

  return (
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
            <a href={link.href} onClick={(e) => handleNav(e, link.href)}>
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
  )
}
