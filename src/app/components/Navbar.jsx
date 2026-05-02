import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'
import logo from '../../assets/logo.png'

const NAV_ITEMS = [
  { label: 'Home',    href: '/',        active: true },
  { label: 'Connect', href: '/connect' },
  { label: 'Profile', href: '/profile' },
  { label: 'Events',  href: '/join',    accent: true },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const ACCENT = '#7c5cd8'

  function go(href) {
    setOpen(false)
    navigate(href)
  }

  return (
    <div className="flex justify-center pt-4 sm:pt-6 px-3 sm:px-4">
      <div className="bg-white rounded-full shadow-sm border border-neutral-200 pl-2 pr-2 py-2 w-full max-w-[760px] relative flex items-center">
        {/* Logo */}
        <button
          onClick={() => go('/')}
          className="shrink-0 pl-1 inline-flex items-center"
          aria-label="FishNet home"
        >
          <img src={logo} alt="FishNet" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
        </button>

        {/* Desktop links */}
        <nav className="hidden md:flex items-center gap-6 ml-6 text-[14px] text-neutral-800">
          {NAV_ITEMS.map(item => (
            <button
              key={item.label}
              onClick={() => go(item.href)}
              className="flex items-center gap-1.5 hover:text-neutral-950"
            >
              {item.active && (
                <span className="inline-block rounded-full bg-black" style={{ width: '6px', height: '6px' }} />
              )}
              <span style={{ color: item.accent ? ACCENT : undefined }}>{item.label}</span>
              {item.accent && <ChevronDown size={14} color={ACCENT} strokeWidth={2} />}
            </button>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2">
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
                    {item.active && (
                      <span className="inline-block rounded-full bg-black" style={{ width: '6px', height: '6px' }} />
                    )}
                    <span style={{ color: item.accent ? ACCENT : undefined }}>{item.label}</span>
                    {item.accent && <ChevronDown size={14} color={ACCENT} strokeWidth={2} />}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
