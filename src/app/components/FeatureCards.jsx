import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import jellyfish from '../../assets/jellyfish.png'

const ACCENT = '#7c5cd8'

const FEATURES = [
  {
    label:       'Profile',
    description: 'Pick your fish, write your bio, link your socials.',
    href:        '/profile',
  },
  {
    label:       'Join Event',
    description: 'Drop into a shared aquarium with everyone there.',
    href:        '/join',
  },
  {
    label:       'Connect',
    description: 'Find friends and mutuals from your events.',
    href:        '/connect',
  },
]

export default function FeatureCards() {
  const navigate = useNavigate()

  return (
    <div className="px-3 sm:px-4">
      <div
        className="rounded-3xl p-4 sm:p-6 w-full max-w-[880px] mx-auto"
        style={{ backgroundColor: '#f5f2ee' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {FEATURES.map(f => (
            <button
              key={f.label}
              onClick={() => navigate(f.href)}
              className="bg-white rounded-2xl p-5 flex flex-col gap-3 text-left transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <img
                  src={jellyfish}
                  alt=""
                  className="w-14 h-14 object-contain"
                  style={{ filter: 'drop-shadow(0 6px 12px rgba(124, 92, 216, 0.2))' }}
                />
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ backgroundColor: ACCENT }}
                >
                  <ChevronRight size={14} className="text-white" />
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[16px] font-semibold text-neutral-900">{f.label}</span>
                <span className="text-[13px] text-neutral-600 leading-snug">{f.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
