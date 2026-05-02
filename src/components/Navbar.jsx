import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, LogOut, Menu, User, MessageCircle } from 'lucide-react'
import { isLoggedIn, logout, getSession } from '../lib/auth'
import { useUnreadDmCount } from '../lib/chat'
import { playChime } from '../lib/audio'

const ACCENT = '#7c5cd8'

// Show the username as-is when it looks like an email; otherwise prefix with @.
function fmtHandle(username) {
  if (!username) return '@guest'
  return username.includes('@') ? username : `@${username}`
}

const NAV_ITEMS = [
  { label: 'Home',    href: '/' },
  { label: 'Connect', href: '/connect' },
  { label: 'Friends', href: '/friends' },
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
          <p className="modal-subtitle">We&apos;re not the kind of fish that steal your data.</p>
        </div>
        <div className="privacy-body">
          <ul className="privacy-list">
            <li>
              <span className="privacy-icon" aria-hidden>👤</span>
              <div className="privacy-text">
                <strong>Your username</strong>
                <span>So we know which fish is you in the aquarium.</span>
              </div>
            </li>
            <li>
              <span className="privacy-icon" aria-hidden>🎟️</span>
              <div className="privacy-text">
                <strong>Event participation</strong>
                <span>So we know which aquarium to drop you into.</span>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const accountWrapRef = useRef(null)
  const loggedIn  = isLoggedIn()
  const session   = loggedIn ? getSession() : null
  const initial   = session?.username?.[0]?.toUpperCase() || '?'
  const unreadDms    = useUnreadDmCount()
  const prevUnreadRef = useRef(null)
  useEffect(() => {
    if (prevUnreadRef.current === null) { prevUnreadRef.current = unreadDms; return }
    if (unreadDms > prevUnreadRef.current) playChime()
    prevUnreadRef.current = unreadDms
  }, [unreadDms])

  function go(href) { setOpen(false); setAccountOpen(false); navigate(href) }
  function handleLogout() { setOpen(false); setAccountOpen(false); logout(); navigate('/login') }

  // Close the account popover on outside click
  useEffect(() => {
    if (!accountOpen) return
    function onDown(e) {
      if (!accountWrapRef.current) return
      if (!accountWrapRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [accountOpen])

  return (
    <>
      <div
        className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4"
        style={{ position: 'relative', zIndex: 40, fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div
          className="rounded-full pl-4 pr-2 py-2 w-full max-w-[760px] relative flex items-center"
          style={{
            background: 'linear-gradient(180deg, rgba(232, 240, 255, 0.42) 0%, rgba(196, 218, 250, 0.28) 100%)',
            backdropFilter: 'blur(18px) saturate(160%)',
            WebkitBackdropFilter: 'blur(18px) saturate(160%)',
            border: '1px solid rgba(220, 232, 255, 0.38)',
            boxShadow: '0 10px 28px rgba(30, 60, 110, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.45)',
          }}
        >
          {/* Desktop nav — left-aligned, account cluster stays on the right */}
          <nav className="hidden md:flex items-center gap-1 text-[14px] text-neutral-800 ml-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.label}
                onClick={() => go(item.href)}
                className="nav-tab"
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => setShowPrivacy(true)}
              className="nav-tab nav-tab-accent inline-flex items-center gap-1.5"
            >
              Privacy
              <ChevronDown size={14} color={ACCENT} strokeWidth={2} />
            </button>
          </nav>

          {/* Right cluster */}
          <div className="ml-auto flex items-center gap-2">
            {loggedIn && (
              <button
                onClick={() => go('/messages')}
                className="nav-message-btn"
                aria-label="Messages"
                title="Messages"
              >
                <MessageCircle size={17} strokeWidth={2.1} />
                {unreadDms > 0 && (
                  <span className="nav-notif-badge">{unreadDms > 9 ? '9+' : unreadDms}</span>
                )}
              </button>
            )}
            {loggedIn ? (
              <div className="relative" ref={accountWrapRef}>
                <button
                  onClick={() => setAccountOpen(o => !o)}
                  className="inline-flex items-center gap-2 rounded-full pl-3 pr-1 py-1 text-[13px] sm:text-[14px] text-white"
                  style={{ backgroundColor: ACCENT }}
                  title={fmtHandle(session?.username)}
                  aria-expanded={accountOpen}
                  aria-haspopup="menu"
                >
                  <span className="hidden sm:inline">{fmtHandle(session?.username)}</span>
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white/25 font-bold">
                    {initial}
                  </span>
                </button>

                {accountOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full mt-2 w-44 rounded-2xl p-2 z-30"
                    style={{
                      background: 'rgba(255, 255, 255, 0.85)',
                      backdropFilter: 'blur(14px) saturate(140%)',
                      WebkitBackdropFilter: 'blur(14px) saturate(140%)',
                      border: '1px solid rgba(255, 255, 255, 0.6)',
                      boxShadow: '0 12px 28px rgba(40, 70, 110, 0.18)',
                    }}
                  >
                    <button
                      role="menuitem"
                      onClick={() => go('/profile')}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-neutral-800 hover:bg-neutral-100 text-left"
                    >
                      <User size={15} className="text-neutral-500" />
                      Profile
                    </button>
                    <button
                      role="menuitem"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut size={15} />
                      Log out
                    </button>
                  </div>
                )}
              </div>
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
            <div
              className="absolute top-full left-2 right-2 mt-2 rounded-2xl p-3 z-20 md:hidden"
              style={{
                background: 'rgba(255, 255, 255, 0.85)',
                backdropFilter: 'blur(14px) saturate(140%)',
                WebkitBackdropFilter: 'blur(14px) saturate(140%)',
                border: '1px solid rgba(255, 255, 255, 0.6)',
                boxShadow: '0 12px 28px rgba(40, 70, 110, 0.18)',
              }}
            >
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
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] text-rose-600 hover:bg-rose-50 text-left"
                    >
                      <LogOut size={15} />
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
