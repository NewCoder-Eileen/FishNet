import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { Sparkles } from '@react-three/drei'
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

function SceneBackground() {
  return (
    <div className="scene-background">
      <Canvas camera={{ position: [0, 0, 6], fov: 50 }}>
        {/* Soft pastel mist — distant geometry fades into lavender */}
        <fog attach="fog" args={['#c8d8ff', 8, 22]} />

        {/* Warm pink-lavender ambient */}
        <ambientLight intensity={0.4} color="#e8d8ff" />
        {/* Sun-through-mist from above */}
        <directionalLight position={[2, 8, 5]} intensity={1.1} color="#fff5ff" />
        {/* Purple rim light from below */}
        <pointLight position={[-5, -3, -4]} intensity={0.6} color="#b48cff" />

        {/* Suspended particles — bubbles / dust motes */}
        <Sparkles
          count={200}
          scale={[20, 20, 20]}
          size={3}
          speed={0.3}
          opacity={0.85}
          color="#ffffff"
        />

      </Canvas>
    </div>
  )
}

function App() {
  return (
    <>
      <SceneBackground />
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