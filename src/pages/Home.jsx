import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../App.css'

// Button routes — keep in sync with Navbar.jsx
const NAV_BUTTONS = [
  { label: 'Profile',    graphic: null, href: '/#profile'  },
  { label: 'Join Event', graphic: null, href: '/join'       },
  { label: 'Connect',    graphic: null, href: '/#connect'   },
]

function useFadeIn() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  return ref
}

function useBubbles() {
  useEffect(() => {
    let lastY = window.scrollY
    let cooldown = false

    function spawnBubble() {
      const bubble = document.createElement('div')
      bubble.className = 'scroll-bubble'
      const size = 18 + Math.random() * 32
      bubble.style.cssText = `
        left: ${5 + Math.random() * 90}%;
        bottom: 0;
        width: ${size}px;
        height: ${size}px;
        animation-duration: ${2 + Math.random() * 2}s;
        animation-delay: ${Math.random() * 0.3}s;
      `
      document.body.appendChild(bubble)
      bubble.addEventListener('animationend', () => bubble.remove())
    }

    function onScroll() {
      const currentY = window.scrollY
      if (currentY < lastY || cooldown) { lastY = currentY; return }
      lastY = currentY
      cooldown = true
      const count = 2 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) spawnBubble()
      setTimeout(() => { cooldown = false }, 120)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
}

function Jellyfish({ label, graphic, href }) {
  const ref = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('visible') },
      { threshold: 0.15 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  function handleClick() {
    if (href.startsWith('/#')) {
      const id = href.slice(2)
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(href)
    }
  }

  return (
    <button type="button" className="jellyfish fade-up" ref={ref} onClick={handleClick}>
      <div className="jelly-bell">
        <div className="jelly-shine" />
        <div className="jelly-graphic">
          {graphic && <img src={graphic} alt="" />}
        </div>
        <span className="jelly-label">{label}</span>
      </div>
      <div className="jelly-tentacles">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="tentacle" style={{ '--i': i }} />
        ))}
      </div>
    </button>
  )
}

function Section({ className, id, children }) {
  const ref = useFadeIn()
  return (
    <section className={`${className} fade-up`} id={id} ref={ref}>
      {children}
    </section>
  )
}

export default function Home() {
  useBubbles()

  return (
    <>
      <Navbar />
      <main>
        <section className="hero" id="home">
          <div className="hero-logo-placeholder fade-up visible">Your Logo Here</div>
        </section>

        <section className="hero" id="profile" style={{ minHeight: '30vh' }}>
          {/* Profile section placeholder */}
        </section>

        <Section className="about-section" id="about">
          <h2>About</h2>
          <p>Tell your story here — what is fishnet, who is it for, and what makes it different.</p>
        </Section>

        <section className="about-section fade-up" id="connect" style={{ borderTop: '1px solid rgba(180,150,220,0.2)' }}>
          <h2 style={{
            fontSize: 36, marginBottom: 16,
            background: 'linear-gradient(90deg, #c06090, #7060d0, #40a0d0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Connect</h2>
          <p style={{ color: '#6050a0', fontSize: 17, lineHeight: 1.8 }}>
            Find friends, join events, and swim together. Connection features coming soon.
          </p>
        </section>

        <Section className="btn-section" id="join-event">
          <div className="btn-grid">
            {NAV_BUTTONS.map((btn) => (
              <Jellyfish key={btn.label} {...btn} />
            ))}
          </div>
        </Section>

        <Section className="privacy-section" id="privacy">
          <h2>Privacy</h2>
          <div className="privacy-body">
            <p className="privacy-tagline">
              🐟 We promise we&apos;re not evil fish stealing your data.
            </p>
            <p>
              Here&apos;s what we actually collect — and it&apos;s not much:
            </p>
            <ul className="privacy-list">
              <li>🐠 <strong>Your username</strong> — so we know which fish is you in the aquarium.</li>
              <li>🪸 <strong>Event participation</strong> — so we know which aquarium to drop you into.</li>
              <li>🫧 <strong>That&apos;s genuinely it.</strong> No tracking, no ads, no shady stuff.</li>
            </ul>
            <p>
              We don&apos;t sell your data. We don&apos;t share it with sharks, third parties, or anyone
              else. fishnet is a chill zone — your info stays yours.
            </p>
            <p className="privacy-footer">
              Questions? We&apos;re just fish. But friendly ones. 🌊
            </p>
          </div>
        </Section>
      </main>
    </>
  )
}