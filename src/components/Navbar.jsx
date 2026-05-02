import { useNavigate } from 'react-router-dom'

const NAV_LINKS = [
  { label: 'Home',       href: '/' },
  { label: 'Profile',    href: '/profile' },
  { label: 'Join Event', href: '/join' },
  { label: 'Connect',    href: '/connect' },
  { label: 'About',      href: '/#about' },
  { label: 'Privacy',    href: '/#privacy' },
]

export default function Navbar({ dark = false }) {
  const navigate = useNavigate()

  function handleNav(e, href) {
    e.preventDefault()
    if (href.startsWith('/#')) {
      navigate('/')
      setTimeout(() => {
        const id = href.slice(2)
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
      }, 80)
    } else {
      navigate(href)
    }
  }

  return (
    <nav className={`navbar${dark ? ' navbar-dark' : ''}`}>
      <div className="nav-logo">
        <div className="nav-logo-placeholder">Logo</div>
      </div>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link.label}>
            <a href={link.href} onClick={(e) => handleNav(e, link.href)}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}