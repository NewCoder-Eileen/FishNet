import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import '../App.css'

const NAV_BUTTONS = [
  { label: 'Profile',    graphic: null, href: '/#profile'  },
  { label: 'Join Event', graphic: null, href: '/join'       },
  { label: 'Connect',    graphic: null, href: '/#connect'   },
]

// ── Placeholder boxes — swap `content` for real graphics later ──
const PLACEHOLDER_BOXES = [
  { id: 'box-tl', label: 'Feature A', hint: 'Replace with graphic' },
  { id: 'box-tr', label: 'Feature B', hint: 'Replace with graphic' },
  { id: 'box-bl', label: 'Feature C', hint: 'Replace with graphic' },
  { id: 'box-br', label: 'Feature D', hint: 'Replace with graphic' },
]

// ── Hooks ──
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

function useScrollBubbles() {
  useEffect(() => {
    let lastY = window.scrollY
    let cooldown = false
    function spawnBubble() {
      const el = document.createElement('div')
      el.className = 'scroll-bubble'
      const size = 18 + Math.random() * 32
      el.style.cssText = `left:${5+Math.random()*90}%;bottom:0;width:${size}px;height:${size}px;animation-duration:${2+Math.random()*2}s;animation-delay:${Math.random()*0.3}s;`
      document.body.appendChild(el)
      el.addEventListener('animationend', () => el.remove())
    }
    function onScroll() {
      const y = window.scrollY
      if (y < lastY || cooldown) { lastY = y; return }
      lastY = y; cooldown = true
      for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) spawnBubble()
      setTimeout(() => { cooldown = false }, 120)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
}

// ── Ambient bubbles (always floating, not scroll-triggered) ──
function AmbientBubbles() {
  const bubbles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    size:  8  + Math.random() * 28,
    left:  2  + Math.random() * 96,
    delay: Math.random() * 12,
    dur:   8  + Math.random() * 10,
    drift: (Math.random() - 0.5) * 60,
  })), [])

  return (
    <div className="ambient-bubbles" aria-hidden>
      {bubbles.map(b => (
        <div
          key={b.id}
          className="amb-bubble"
          style={{
            width: b.size, height: b.size,
            left: `${b.left}%`,
            animationDuration: `${b.dur}s`,
            animationDelay: `${b.delay}s`,
            '--drift': `${b.drift}px`,
          }}
        />
      ))}
    </div>
  )
}

// ── Tiny floating particles ──
function Particles() {
  const particles = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    size:  2 + Math.random() * 3,
    left:  Math.random() * 100,
    top:   Math.random() * 100,
    delay: Math.random() * 14,
    dur:   10 + Math.random() * 12,
  })), [])

  return (
    <div className="particles" aria-hidden>
      {particles.map(p => (
        <div
          key={p.id}
          className="particle"
          style={{
            width: p.size, height: p.size,
            left: `${p.left}%`,
            top:  `${p.top}%`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Light rays from top ──
function LightRays() {
  const rays = useMemo(() => Array.from({ length: 7 }, (_, i) => ({
    id: i,
    left: 5 + i * 14 + Math.random() * 6,
    delay: Math.random() * 5,
    dur: 6 + Math.random() * 5,
    width: 40 + Math.random() * 80,
    opacity: 0.04 + Math.random() * 0.06,
  })), [])

  return (
    <div className="light-rays" aria-hidden>
      {rays.map(r => (
        <div
          key={r.id}
          className="light-ray"
          style={{
            left: `${r.left}%`,
            width: r.width,
            opacity: r.opacity,
            animationDuration: `${r.dur}s`,
            animationDelay: `${r.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Sea plants at the bottom ──
function SeaPlants() {
  const plants = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: 0.5 + i * 5.5 + Math.random() * 4,
    // wide range so you get tiny sprigs next to tall stalks
    height: 18 + Math.pow(Math.random(), 1.6) * 120,
    delay: Math.random() * 3,
    dur: 2 + Math.random() * 3,
    hue: 138 + Math.random() * 55,
    segments: 2 + Math.floor(Math.random() * 3),
  })), [])

  return (
    <div className="sea-plants" aria-hidden>
      {plants.map(p => (
        <div
          key={p.id}
          className="sea-plant"
          style={{
            left: `${p.left}%`,
            height: p.height,
            width: 6 + p.height * 0.08,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            background: `linear-gradient(to top, hsla(${p.hue},55%,35%,0.88), hsla(${p.hue+15},60%,52%,0.35))`,
          }}
        />
      ))}
    </div>
  )
}

// ── Floating logo ──
function FloatingLogo() {
  return (
    <div className="floating-logo-wrap">
      <div className="floating-logo">
        {/* Swap this div for your <img src={logo} /> when ready */}
        <div className="logo-placeholder-inner">Your Logo</div>
      </div>
    </div>
  )
}

// ── Glassy placeholder box ──
function PlaceholderBox({ id, label, hint }) {
  return (
    // To replace: swap the inner content with your <img> or component
    <div className="glass-box" id={id}>
      <span className="glass-box-label">{label}</span>
      <span className="glass-box-hint">{hint}</span>
    </div>
  )
}

// ── Hero section ──
function HeroSection() {
  return (
    <section className="hero-aquatic" id="home">
      <LightRays />
      <AmbientBubbles />
      <Particles />

      <div className="hero-grid">
        <PlaceholderBox {...PLACEHOLDER_BOXES[0]} />
        <FloatingLogo />
        <PlaceholderBox {...PLACEHOLDER_BOXES[1]} />
        <PlaceholderBox {...PLACEHOLDER_BOXES[2]} />
        <div className="hero-grid-center-bottom" />
        <PlaceholderBox {...PLACEHOLDER_BOXES[3]} />
      </div>

      <SeaPlants />
    </section>
  )
}

// ── Jellyfish button ──
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
      document.getElementById(href.slice(2))?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate(href)
    }
  }

  return (
    <button type="button" className="jellyfish fade-up" ref={ref} onClick={handleClick}>
      <div className="jelly-bell">
        <div className="jelly-shine" />
        <div className="jelly-graphic">{graphic && <img src={graphic} alt="" />}</div>
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

// ── Page ──
export default function Home() {
  useScrollBubbles()

  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

        <section id="profile" style={{ height: 1 }} />

        <Section className="about-section" id="about">
          <h2>About</h2>
          <p>Tell your story here — what is fishnet, who is it for, and what makes it different.</p>
        </Section>

        <section className="about-section fade-up" id="connect">
          <h2 style={{
            fontSize: 36, marginBottom: 16,
            background: 'linear-gradient(90deg, #c06090, #7060d0, #40a0d0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>Connect</h2>
          <p style={{ color: '#6050a0', fontSize: 17, lineHeight: 1.8 }}>
            Find friends, join events, and swim together. Connection features coming soon.
          </p>
        </section>

        <Section className="btn-section" id="join-event">
          <div className="btn-grid">
            {NAV_BUTTONS.map(btn => <Jellyfish key={btn.label} {...btn} />)}
          </div>
        </Section>

        <Section className="privacy-section" id="privacy">
          <h2>Privacy</h2>
          <div className="privacy-body">
            <p className="privacy-tagline">🐟 We promise we&apos;re not evil fish stealing your data.</p>
            <p>Here&apos;s what we actually collect — and it&apos;s not much:</p>
            <ul className="privacy-list">
              <li>🐠 <strong>Your username</strong> — so we know which fish is you in the aquarium.</li>
              <li>🪸 <strong>Event participation</strong> — so we know which aquarium to drop you into.</li>
              <li>🫧 <strong>That&apos;s genuinely it.</strong> No tracking, no ads, no shady stuff.</li>
            </ul>
            <p>We don&apos;t sell your data. We don&apos;t share it with sharks, third parties, or anyone else. fishnet is a chill zone — your info stays yours.</p>
            <p className="privacy-footer">Questions? We&apos;re just fish. But friendly ones. 🌊</p>
          </div>
        </Section>
      </main>
    </>
  )
}