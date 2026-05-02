import { useEffect, useRef } from 'react'
import './App.css'

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

function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-logo">
        {null ?? <div className="nav-logo-placeholder">Logo</div>}
      </div>
      <ul className="nav-links">
        {NAV_LINKS.map((link) => (
          <li key={link}><a href={`#${link.toLowerCase().replace(' ', '-')}`}>{link}</a></li>
        ))}
      </ul>
    </nav>
  )
}

function Jellyfish({ label, graphic }) {
  const ref = useFadeIn()
  return (
    <button type="button" className="jellyfish fade-up" ref={ref}>
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

function App() {
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
              <Jellyfish key={btn.label} {...btn} />
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

export default App