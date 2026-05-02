import { ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import FishnetBackground from './components/FishnetBackground'
import JellyfishField from './components/JellyfishField'
import FeatureCards from './components/FeatureCards'
import '../styles/fonts.css'

const ACCENT = '#7c5cd8'

export default function ConvixApp() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen w-full p-3 sm:p-4"
      style={{ backgroundColor: '#ededed', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div
        className="relative w-full h-[calc(100vh-24px)] sm:h-[calc(100vh-32px)] overflow-hidden rounded-2xl sm:rounded-3xl"
        style={{ backgroundColor: '#1a3a52' }}
      >
        {/* Layer 1 — animated aquatic canvas (gradient, light rays, fish, bubbles) */}
        <div className="absolute inset-0" style={{ zIndex: 1 }}>
          <FishnetBackground />
        </div>

        {/* Layer 2 — drifting jellyfish */}
        <JellyfishField />

        {/* Layer 3 — soft white veil for legibility */}
        <div className="absolute inset-0 bg-white/10" style={{ zIndex: 3 }} />

        {/* Layer 4 — foreground content */}
        <div className="relative" style={{ zIndex: 10 }}>
          <Navbar />

          <div className="flex flex-col items-center px-4 pt-10 sm:pt-16 pb-6 sm:pb-10 text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm text-[13px] text-neutral-800">
              <span
                className="inline-block rounded-full"
                style={{ width: '8px', height: '8px', backgroundColor: ACCENT }}
              />
              FishNet
            </div>

            {/* Headline */}
            <h1
              className="mt-5 sm:mt-6 max-w-4xl text-neutral-900"
              style={{
                fontSize: 'clamp(36px, 8vw, 72px)',
                lineHeight: 1.05,
                fontWeight: 500,
                letterSpacing: '-0.02em',
              }}
            >
              Make new{' '}
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontWeight: 400 }}>
                Friends
              </span>
              <br />
              at your next event
            </h1>

            {/* Subtitle */}
            <p
              className="mt-4 sm:mt-6 text-neutral-800 px-2 max-w-2xl"
              style={{ fontSize: 'clamp(13px, 3.5vw, 16px)' }}
            >
              FishNet drops you into a shared aquarium with everyone at your event — find people you actually click with.
            </p>

            {/* CTA */}
            <button
              onClick={() => navigate('/join')}
              className="mt-6 sm:mt-8 inline-flex items-center gap-3 text-white rounded-full pl-6 sm:pl-7 pr-2 py-2 sm:py-2.5 text-[14px]"
              style={{ backgroundColor: '#0b0f1a' }}
            >
              Join an Event
              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white/15">
                <ChevronRight size={16} className="text-white" />
              </span>
            </button>
          </div>

          {/* FishNet feature cards (Profile / Join Event / Connect) */}
          <FeatureCards />
        </div>
      </div>
    </div>
  )
}
