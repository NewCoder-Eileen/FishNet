import { useNavigate } from 'react-router-dom'
import jellyfishPink from '../../assets/jellyfish-pink.png'
import jellyfishBlue from '../../assets/jellyfish-blue.png'

const FEATURES = [
  { label: 'Profile',    href: '/profile', icon: jellyfishPink, glow: 'rgba(220, 130, 180, 0.45)' },
  { label: 'Join Event', href: '/join',    icon: jellyfishBlue, glow: 'rgba(120, 140, 220, 0.45)' },
  { label: 'Connect',    href: '/connect', icon: jellyfishPink, glow: 'rgba(220, 130, 180, 0.45)' },
]

// Three large jellyfish that *are* the buttons — click the jellyfish itself
// to navigate. No card chrome.
export default function FeatureCards() {
  const navigate = useNavigate()

  return (
    <div className="px-4">
      <div className="flex flex-wrap items-end justify-center gap-8 sm:gap-14 max-w-[880px] mx-auto">
        {FEATURES.map(f => (
          <button
            key={f.label}
            onClick={() => navigate(f.href)}
            className="jelly-btn group flex flex-col items-center gap-3 cursor-pointer bg-transparent border-0"
            aria-label={f.label}
          >
            <img
              src={f.icon}
              alt=""
              className="jelly-btn-img w-24 h-24 sm:w-32 sm:h-32 object-contain transition-transform duration-300 group-hover:-translate-y-1.5 group-hover:scale-105"
              style={{ filter: `drop-shadow(0 10px 22px ${f.glow})` }}
            />
            <span className="text-[14px] sm:text-[15px] font-medium text-white tracking-wide drop-shadow">
              {f.label}
            </span>
          </button>
        ))}
      </div>

      <style>{`
        .jelly-btn-img { animation: jelly-bob 4.5s ease-in-out infinite; }
        .jelly-btn:nth-child(2) .jelly-btn-img { animation-delay: -1.2s; }
        .jelly-btn:nth-child(3) .jelly-btn-img { animation-delay: -2.6s; }
        @keyframes jelly-bob {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-6px); }
        }
        .jelly-btn:hover .jelly-btn-img { animation-play-state: paused; }
      `}</style>
    </div>
  )
}
