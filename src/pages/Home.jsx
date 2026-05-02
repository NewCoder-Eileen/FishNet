import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

const NAV_LINKS = ['Home', 'Profile', 'Join Event', 'Connect', 'About', 'Privacy']
const NAV_BUTTONS = [
  { label: 'Profile',    graphic: null },
  { label: 'Join Event', graphic: null },
  { label: 'Connect',    graphic: null },
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

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        <div className="nav-logo-placeholder">Logo</div>
      </div>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link}><a href={`#${link.toLowerCase().replace(' ', '-')}`}>{link}</a></li>
        ))}
      </ul>
    </nav>
  )
}

function Jellyfish({ label, graphic, onClick }) {
  const ref = useFadeIn()
  return (
    <button type="button" className="jellyfish fade-up" ref={ref} onClick={onClick}>
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
  const navigate = useNavigate()
  useBubbles()

  function handleButtonClick(label) {
    if (label === 'Join Event') navigate('/join')
    if (label === 'Profile')    navigate('/profile')
  }

  return (
    <>
      <Navbar />
      <main>
        <section className="hero" id="home">
          <div className="hero-logo-placeholder fade-up visible">Your Logo Here</div>
        </section>

        <Section className="about-section" id="about">
          <h2>About</h2>
          <p>Tell your story here — what is fishnet, who is it for, and what makes it different.</p>
        </Section>

        <Section className="btn-section" id="join-event">
          <div className="btn-grid">
            {NAV_BUTTONS.map((btn) => (
              <Jellyfish key={btn.label} {...btn} onClick={() => handleButtonClick(btn.label)} />
            ))}
          </div>
        </Section>

        <Section className="privacy-section" id="privacy">
          <h2>Privacy</h2>
          <p>Your privacy policy goes here.</p>
        </Section>
      </main>
    </>
  )
}