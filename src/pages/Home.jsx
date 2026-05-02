import { useEffect, useRef, useMemo, Suspense } from 'react'
import { useNavigate } from 'react-router-dom'
import { Canvas, useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import Navbar from '../components/Navbar'
import seaweed1 from '../assets/seaweed1.webp'
import seaweed2 from '../assets/seaweed2.webp'
import iconProfile from '../assets/icon-profile.webp'
import iconJoin    from '../assets/icon-join.webp'
import iconConnect from '../assets/icon-connect.webp'
import fishGLB from '../assets/FISHI.glb'
import fishBlueCute from '../assets/fish-blue-cute.webp'
import fishClown    from '../assets/fish-clown.webp'
import fishPink     from '../assets/fish-pink.webp'
import fishSimple   from '../assets/fish-simple.webp'
import '../App.css'

const NAV_BUTTONS = [
  { label: 'Profile',    graphic: iconProfile, href: '/profile'   },
  { label: 'Join Event', graphic: iconJoin,    href: '/join'       },
  { label: 'Connect',    graphic: iconConnect, href: '/#connect'   },
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
  // Slower and more varied so the rise feels buoyant rather than mechanical.
  // Tiny bubbles travel a touch faster than large ones (bigger ones get longer durations).
  const bubbles = useMemo(() => Array.from({ length: 18 }, (_, i) => {
    const size = 6 + Math.random() * 26
    return {
      id: i,
      size,
      left:  2 + Math.random() * 96,
      delay: Math.random() * 18,
      // 18–34s, with bigger bubbles biased slower
      dur:   18 + Math.random() * 12 + (size / 32) * 4,
      drift: (Math.random() - 0.5) * 90,
      wobble: 14 + Math.random() * 22,
    }
  }), [])

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
            '--drift':  `${b.drift}px`,
            '--wobble': `${b.wobble}px`,
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

// ── 3-D interactive fish ──
function FishScene({ mouseRef }) {
  const { scene } = useGLTF(fishGLB)
  const groupRef  = useRef()

  useFrame(({ clock }) => {
    if (!groupRef.current) return
    const m = mouseRef.current
    // Wider rotation range + faster lerp so the fish feels responsive to the cursor.
    const tY =  (m.x - 0.5) * Math.PI * 0.75
    const tX = -(m.y - 0.5) * Math.PI * 0.32
    groupRef.current.rotation.y += (tY - groupRef.current.rotation.y) * 0.14
    groupRef.current.rotation.x += (tX - groupRef.current.rotation.x) * 0.14
    groupRef.current.position.y  = Math.sin(clock.elapsedTime * 0.75) * 0.12
  })

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={0.85} />
    </group>
  )
}

function InteractiveFish() {
  const mouseRef     = useRef({ x: 0.5, y: 0.5 })
  const bubbleCanRef = useRef(null)
  const bubblesRef   = useRef([])
  const lastBubRef   = useRef(0)

  useEffect(() => {
    function onMove(e) {
      mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const canvas = bubbleCanRef.current
    if (!canvas) return () => window.removeEventListener('mousemove', onMove)
    const ctx = canvas.getContext('2d')
    let raf

    function resize() {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function tick(ts) {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)

      if (ts - lastBubRef.current > 380 + Math.random() * 480) {
        lastBubRef.current = ts
        bubblesRef.current.push({
          x: W * 0.5 + (Math.random() - 0.5) * 28,
          y: H * 0.58 + (Math.random() - 0.5) * 18,
          r: 3 + Math.random() * 5,
          life: 1,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.9 - Math.random() * 0.55,
        })
      }

      for (let i = bubblesRef.current.length - 1; i >= 0; i--) {
        const b = bubblesRef.current[i]
        b.x += b.vx; b.y += b.vy; b.vy -= 0.009; b.life -= 0.005
        if (b.life <= 0) { bubblesRef.current.splice(i, 1); continue }
        ctx.save()
        ctx.globalAlpha = b.life * 0.8
        ctx.strokeStyle = 'rgba(160,215,255,0.9)'; ctx.lineWidth = 1.4
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle  = `rgba(220,240,255,${b.life * 0.18})`; ctx.fill()
        ctx.fillStyle  = 'rgba(255,255,255,0.75)'
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.3, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <div className="fish3d-wrap" aria-hidden>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 38 }} dpr={[1, 1.5]}
        style={{ width: '100%', height: '100%', background: 'transparent' }}
        gl={{ alpha: true, antialias: true }}>
        <ambientLight intensity={1.4} color="#ffffff" />
        <directionalLight position={[3, 4, 3]} intensity={2.0} color="#f0f4ff" />
        <pointLight position={[-2, 2, 2]} intensity={0.6} color="#dde8ff" />
        <Suspense fallback={null}>
          <FishScene mouseRef={mouseRef} />
        </Suspense>
      </Canvas>
      <canvas ref={bubbleCanRef} className="fish-bubble-canvas" aria-hidden />
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
  const plants = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    id: i,
    src:   i % 2 === 0 ? seaweed1 : seaweed2,
    left:  i * 8.5 - 2 + Math.random() * 4,
    scale: 0.55 + Math.random() * 0.6,
    delay: Math.random() * 4,
    dur:   2.8 + Math.random() * 2.2,
    flip:  Math.random() > 0.5,
  })), [])

  return (
    <div className="sea-plants" aria-hidden>
      {plants.map(p => (
        <img
          key={p.id}
          src={p.src}
          className="sea-plant-img"
          style={{
            left: `${p.left}%`,
            height: `${90 + p.scale * 90}px`,
            '--flip': p.flip ? -1 : 1,
            animationDuration: `${p.dur}s`,
            animationDelay: `${-p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

// ── Background fish ──
const BG_FISH_IMGS = [fishBlueCute, fishClown, fishPink, fishSimple]

function BackgroundFish() {
  const fish = useMemo(() => Array.from({ length: 10 }, (_, i) => ({
    id: i,
    src:     BG_FISH_IMGS[i % BG_FISH_IMGS.length],
    top:     10 + Math.random() * 75,
    size:    36 + Math.random() * 44,
    dur:     18 + Math.random() * 20,
    delay:   Math.random() * 30,
    flipX:   true,
    opacity: 0.13 + Math.random() * 0.15,
  })), [])

  return (
    <div className="bg-fish-layer" aria-hidden>
      {fish.map(f => (
        <img
          key={f.id}
          src={f.src}
          className="bg-fish-img ltr"
          style={{
            top: `${f.top}%`,
            width: f.size,
            opacity: f.opacity,
            animationDuration: `${f.dur}s`,
            animationDelay: `${-f.delay}s`,
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
      <span className="floating-logo-text">FishNet</span>
    </div>
  )
}

// ── Hero section ──
function HeroSection() {
  return (
    <section className="hero-aquatic" id="home">
      <LightRays />
      <div className="spotlight-ray" aria-hidden />
      <AmbientBubbles />
      <Particles />
      <BackgroundFish />

      <InteractiveFish />

      <div className="hero-center">
        <FloatingLogo />
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

// ── Caustic light overlay (animated soft streaks) ──
function Caustics() {
  return (
    <>
      <div className="aquarium-caustics layer-a" aria-hidden />
      <div className="aquarium-caustics layer-b" aria-hidden />
    </>
  )
}

// ── Tiny bokeh particles drifting upward ──
function FloatingParticles({ count = 60 }) {
  const particles = useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    size:  1.2 + Math.random() * 4.2,
    left:  Math.random() * 100,
    delay: -Math.random() * 36,
    dur:   22 + Math.random() * 32,
    drift: (Math.random() - 0.5) * 80,
    blur:  0.4 + Math.random() * 1.6,
    op:    0.35 + Math.random() * 0.55,
  })), [count])

  return (
    <div className="aquarium-particles" aria-hidden>
      {particles.map(p => (
        <div
          key={p.id}
          className="aquarium-particle"
          style={{
            width:  p.size,
            height: p.size,
            left:   `${p.left}%`,
            filter: `blur(${p.blur}px)`,
            animationDuration: `${p.dur}s`,
            animationDelay:    `${p.delay}s`,
            '--pdrift':   `${p.drift}px`,
            '--popacity': p.op,
          }}
        />
      ))}
    </div>
  )
}

// ── Page ──
export default function Home() {
  return (
    <div className="home-aquarium-page">
      <Caustics />
      <FloatingParticles />
      <Navbar />
      <main>
        <HeroSection />

        <Section className="about-section" id="about">
          <h2 className="about-title">About FishNet</h2>
          <div className="about-cards">
            <div className="about-card">
              <h3>Who is this for?</h3>
              <p>Hackers, builders, and creatives at events who want to find the right teammates fast — without awkward cold intros or scanning a hundred name badges.</p>
            </div>
            <div className="about-card">
              <h3>When would you use it?</h3>
              <p>At hackathons, club fairs, networking nights, and conferences — any time you're in a room full of strangers and need to surface the people who actually match what you're looking for.</p>
            </div>
            <div className="about-card">
              <h3>Why FishNet?</h3>
              <p>Because the best connections happen when you know who's in the water with you. FishNet turns a sea of faces into a curated list of people worth meeting.</p>
            </div>
          </div>
        </Section>

        <Section className="btn-section" id="quick-actions">
          <h2 className="quick-actions-title">Dive in</h2>
          <p className="quick-actions-sub">Tap a jellyfish to swim in.</p>
          <div className="btn-grid">
            {NAV_BUTTONS.map(btn => <Jellyfish key={btn.label} {...btn} />)}
          </div>
        </Section>

      </main>
    </div>
  )
}