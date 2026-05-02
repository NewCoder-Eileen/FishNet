import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import { isLoggedIn, logout, getSession } from '../lib/auth'
import logo from '../assets/logo.png'

const ACCENT = '#7c5cd8'

const NAV_ITEMS = [
  { label: 'Home',    href: '/' },
  { label: 'Connect', href: '/connect' },
  { label: 'Events',  href: '/join' },
]

function PrivacyModal({ onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal privacy-modal" onClick={e => e.stopPropagation()}>
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

export default function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const loggedIn = isLoggedIn()
  const session  = loggedIn ? getSession() : null
  const initial  = session?.username?.[0]?.toUpperCase() || '?'

  function go(href) { setOpen(false); navigate(href) }
  function handleLogout() { setOpen(false); logout(); navigate('/login') }

  return (
    <>
      <div
        className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4"
        style={{ position: 'relative', zIndex: 40, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div className="bg-white rounded-full shadow-sm border border-neutral-200 pl-2 pr-2 py-2 w-full max-w-[760px] relative flex items-center">
          {/* Logo */}
          <button
            onClick={() => go('/')}
            className="shrink-0 pl-1 inline-flex items-center"
            aria-label="FishNet home"
          >
            <img src={logo} alt="FishNet" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 ml-6 text-[14px] text-neutral-800">
            {NAV_ITEMS.map(item => (
              <button
                key={item.label}
                onClick={() => go(item.href)}
                className="hover:text-neutral-950"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setShowPrivacy(true)}
              className="hover:opacity-80 inline-flex items-center gap-1.5"
              style={{ color: ACCENT }}
            >
              Privacy
              <ChevronDown size={14} color={ACCENT} strokeWidth={2} />
            </button>
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            {loggedIn ? (
              <button
                onClick={() => go('/profile')}
                className="inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-[13px] sm:text-[14px] text-white"
                style={{ backgroundColor: ACCENT }}
                title={`Profile (${session?.username})`}
              >
                <span className="hidden sm:inline">@{session?.username}</span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/25 font-bold">
                  {initial}
                </span>
              </button>
            ) : (
              <button
                onClick={() => go('/login')}
                className="inline-flex items-center gap-2 rounded-full pl-4 pr-1 py-1 text-[13px] sm:text-[14px] text-white"
                style={{ backgroundColor: ACCENT }}
              >
                <span className="hidden sm:inline">Sign in to FishNet</span>
                <span className="sm:hidden">Sign in</span>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/20">
                  <ChevronRight size={14} className="text-white" />
                </span>
              </button>
            )}

            <button
              className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-neutral-100"
              onClick={() => setOpen(o => !o)}
              aria-label="Menu"
            >
              <Menu size={20} className="text-neutral-800" />
            </button>
          </div>

          {/* Mobile dropdown */}
          {open && (
            <div className="absolute top-full left-2 right-2 mt-2 bg-white rounded-2xl shadow-lg border border-neutral-200 p-3 z-20 md:hidden">
              <ul className="flex flex-col">
                {NAV_ITEMS.map(item => (
                  <li key={item.label}>
                    <button
                      onClick={() => go(item.href)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-neutral-800 hover:bg-neutral-100 text-left"
                    >
                      {item.label}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => { setOpen(false); setShowPrivacy(true) }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-left"
                    style={{ color: ACCENT }}
                  >
                    Privacy
                  </button>
                </li>
                {loggedIn && (
                  <li>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-neutral-700 hover:bg-neutral-100 text-left"
                    >
                      Log out
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </div>

      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
    </>
  )
}
