import { useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import logo from '../assets/logo.png'
import jellyfish from '../assets/jellyfish.png'
import '../App.css'

const NAV_BUTTONS = [
  { label: 'Profile',    graphic: null, href: '/profile'  },
  { label: 'Join Event', graphic: null, href: '/join'       },
  { label: 'Connect',    graphic: null, href: '/#connect'   },
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

// ── Background jellyfish ──
function BackgroundJellyfish() {
  const jellies = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    id: i,
    left:    5  + Math.random() * 88,
    bottom: -30 + Math.random() * 40,
    size:   90  + Math.random() * 110,
    delay:       Math.random() * 20,
    dur:    24  + Math.random() * 18,
    drift:  (Math.random() - 0.5) * 100,
    rotate: (Math.random() - 0.5) * 20,
    opacity: 0.55 + Math.random() * 0.3,
  })), [])

  return (
    <div className="bg-jellies" aria-hidden>
      {jellies.map(j => (
        <img
          key={j.id}
          src={jellyfish}
          className="bg-jellyfish"
          style={{
            left: `${j.left}%`,
            bottom: `${j.bottom}%`,
            width: j.size,
            '--jdrift': `${j.drift}px`,
            '--jrotate': `${j.rotate}deg`,
            '--jopacity': j.opacity,
            animationDuration: `${j.dur}s`,
            animationDelay: `${j.delay}s`,
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

// ── Sea plants at the bottom ─────────────────────────────────
// Canvas seaweed for the hero. Three depth layers (bg/mid/fg) with
// multi-frequency sway, smooth Bézier spines, and pointer-reactive
// bend + shimmer + drift particles. Tune everything in HERO_SEAWEED.
const HERO_SEAWEED = {
  count: 26,
  canvasHeight: 200,         // px of canvas above the hero bottom edge
  layers: {
    bg:  { weight: 0.40, scale: 0.78, alpha: 0.40, sway: 10, speedMul: 0.65, blur: 3,  reactRadius:   0, reactStrength:  0 },
    mid: { weight: 0.40, scale: 1.00, alpha: 0.85, sway: 16, speedMul: 1.00, blur: 0,  reactRadius: 110, reactStrength: 14 },
    fg:  { weight: 0.20, scale: 1.20, alpha: 1.00, sway: 22, speedMul: 1.25, blur: 0,  reactRadius: 150, reactStrength: 22 },
  },
  hueMin: 135, hueMax: 188,
  satMin:  32, satMax:  58,
  lightMin: 38, lightMax: 56,
  thickMin: 3, thickMax: 7,
  heightMin: 60, heightMax: 170,
  segments: 14,
  agitationDecay: 0.94,
  bendEase:       0.85,
  agitationBoost: 1.6,
  frondAlpha:     0.55,
  particles: { maxPerPlant: 5, emitChance: 0.18, emitThreshold: 0.35, rise: 0.55 },
}

function pickHeroLayer() {
  const keys = Object.keys(HERO_SEAWEED.layers)
  let r = Math.random()
  for (const k of keys) {
    r -= HERO_SEAWEED.layers[k].weight
    if (r <= 0) return k
  }
  return keys[keys.length - 1]
}

function makeHeroPlants(width) {
  const w = Math.max(width, 320)
  return Array.from({ length: HERO_SEAWEED.count }, () => ({
    x:         20 + Math.random() * (w - 40),
    height:    HERO_SEAWEED.heightMin + Math.random() * (HERO_SEAWEED.heightMax - HERO_SEAWEED.heightMin),
    phase:     Math.random() * Math.PI * 2,
    phase2:    Math.random() * Math.PI * 2,
    speed:     0.6 + Math.random() * 0.8,
    hue:       HERO_SEAWEED.hueMin   + Math.random() * (HERO_SEAWEED.hueMax   - HERO_SEAWEED.hueMin),
    sat:       HERO_SEAWEED.satMin   + Math.random() * (HERO_SEAWEED.satMax   - HERO_SEAWEED.satMin),
    lightness: HERO_SEAWEED.lightMin + Math.random() * (HERO_SEAWEED.lightMax - HERO_SEAWEED.lightMin),
    thick:     HERO_SEAWEED.thickMin + Math.random() * (HERO_SEAWEED.thickMax - HERO_SEAWEED.thickMin),
    layer:     pickHeroLayer(),
    agitation: 0,
    bend:      0,
    particles: [],
  }))
}

function drawHeroPlant(ctx, sw, time, baseY) {
  const cfg = HERO_SEAWEED.layers[sw.layer] || HERO_SEAWEED.layers.mid
  const swayAmt = cfg.sway * (1 + sw.agitation * HERO_SEAWEED.agitationBoost)

  const segs = HERO_SEAWEED.segments
  const pts = new Array(segs + 1)
  for (let i = 0; i <= segs; i++) {
    const t = i / segs
    const sp = sw.speed * cfg.speedMul
    const primary   = Math.sin(time * 0.0010 * sp + sw.phase  + t * 2.4) * swayAmt
    const secondary = Math.sin(time * 0.0017 * sp + sw.phase2 + t * 4.1) * swayAmt * 0.32
    const bend      = sw.bend * t * t
    pts[i] = { x: sw.x + (primary + secondary) * t + bend, y: baseY - sw.height * t }
  }

  ctx.save()
  ctx.globalAlpha = cfg.alpha

  const topY = baseY - sw.height
  const grad = ctx.createLinearGradient(0, topY, 0, baseY)
  grad.addColorStop(0, `hsla(${sw.hue}, ${sw.sat}%, ${sw.lightness + 10}%, 0.95)`)
  grad.addColorStop(1, `hsla(${sw.hue}, ${sw.sat}%, ${sw.lightness - 14}%, 0.95)`)

  if (cfg.blur > 0) {
    ctx.shadowColor = `hsla(${sw.hue}, ${sw.sat}%, ${sw.lightness}%, 0.5)`
    ctx.shadowBlur  = cfg.blur * 2.5
  }
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.lineWidth   = sw.thick * cfg.scale
  ctx.strokeStyle = grad

  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < segs; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2
    const yc = (pts[i].y + pts[i + 1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc)
  }
  ctx.lineTo(pts[segs].x, pts[segs].y)
  ctx.stroke()

  // Fronds
  ctx.shadowBlur = 0
  for (let i = 2; i < segs; i += 2) {
    const p   = pts[i]
    const dir = (i % 4 === 0) ? 1 : -1
    const t   = i / segs
    const lw  = (6 + t * 3) * cfg.scale
    const lh  = (3 + t * 1.5) * cfg.scale
    ctx.beginPath()
    ctx.ellipse(p.x + dir * 6, p.y - 2, lw, lh, dir * (0.3 + t * 0.25), 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${sw.hue + 6}, ${sw.sat}%, ${sw.lightness - 4}%, ${HERO_SEAWEED.frondAlpha})`
    ctx.fill()
  }

  // Shimmer when agitated
  if (sw.agitation > 0.18) {
    ctx.globalAlpha = cfg.alpha * sw.agitation * 0.45
    ctx.lineWidth   = sw.thick * cfg.scale * 2.4
    ctx.strokeStyle = `hsla(${sw.hue + 18}, 70%, 78%, 0.55)`
    ctx.shadowColor = `hsla(${sw.hue + 18}, 90%, 72%, 0.85)`
    ctx.shadowBlur  = 14
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < segs; i++) {
      const xc = (pts[i].x + pts[i + 1].x) / 2
      const yc = (pts[i].y + pts[i + 1].y) / 2
      ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc)
    }
    ctx.lineTo(pts[segs].x, pts[segs].y)
    ctx.stroke()
  }

  ctx.restore()

  // Drift particles
  if (sw.particles.length) {
    ctx.save()
    for (let i = sw.particles.length - 1; i >= 0; i--) {
      const p = sw.particles[i]
      p.life -= 0.012
      if (p.life <= 0) { sw.particles.splice(i, 1); continue }
      p.y -= HERO_SEAWEED.particles.rise
      p.x += p.drift
      const a = Math.max(0, Math.min(1, p.life)) * 0.7
      ctx.fillStyle = `rgba(210, 240, 235, ${a.toFixed(2)})`
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
    }
    ctx.restore()
  }
}

function updateHeroPlants(plants, pointer, baseY) {
  for (const sw of plants) {
    const cfg = HERO_SEAWEED.layers[sw.layer] || HERO_SEAWEED.layers.mid
    sw.agitation *= HERO_SEAWEED.agitationDecay
    sw.bend      *= HERO_SEAWEED.bendEase

    if (cfg.reactRadius > 0 && pointer.active) {
      const swMidY = baseY - sw.height * 0.55
      const dx = pointer.x - sw.x
      const dy = pointer.y - swMidY
      const d  = Math.hypot(dx, dy)
      if (d < cfg.reactRadius) {
        const inf = 1 - d / cfg.reactRadius
        if (inf > sw.agitation) sw.agitation = inf
        const pushDir = -(dx >= 0 ? 1 : -1) * inf
        sw.bend += pushDir * cfg.reactStrength * 0.18
        const cap = cfg.reactStrength
        if (sw.bend >  cap) sw.bend =  cap
        if (sw.bend < -cap) sw.bend = -cap
      }
    }

    const pcfg = HERO_SEAWEED.particles
    if (sw.agitation > pcfg.emitThreshold && Math.random() < pcfg.emitChance) {
      if (sw.particles.length >= pcfg.maxPerPlant) sw.particles.shift()
      sw.particles.push({
        x:     sw.x + (Math.random() - 0.5) * 16,
        y:     baseY - sw.height * (0.35 + Math.random() * 0.55),
        r:     1.2 + Math.random() * 1.6,
        drift: (Math.random() - 0.5) * 0.35,
        life:  1.0,
      })
    }
  }
}

function SeaPlants() {
  const canvasRef = useRef(null)
  const plantsRef = useRef([])
  const pointerRef = useRef({ x: 0, y: 0, active: false })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0

    function resize() {
      const w = canvas.clientWidth
      const h = HERO_SEAWEED.canvasHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      plantsRef.current = makeHeroPlants(w)
    }
    resize()

    function onPointerMove(e) {
      const rect = canvas.getBoundingClientRect()
      pointerRef.current.x = e.clientX - rect.left
      pointerRef.current.y = e.clientY - rect.top
      pointerRef.current.active =
        pointerRef.current.y > -40 && pointerRef.current.y < HERO_SEAWEED.canvasHeight + 40
    }
    function onPointerLeave() { pointerRef.current.active = false }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerleave', onPointerLeave)
    window.addEventListener('resize', resize)

    function loop(ts) {
      const w = canvas.clientWidth
      const h = HERO_SEAWEED.canvasHeight
      const baseY = h
      ctx.clearRect(0, 0, w, h)

      updateHeroPlants(plantsRef.current, pointerRef.current, baseY)
      // Layer order: bg → mid → fg
      for (const layer of ['bg', 'mid', 'fg']) {
        for (const sw of plantsRef.current) {
          if (sw.layer !== layer) continue
          drawHeroPlant(ctx, sw, ts, baseY)
        }
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerleave', onPointerLeave)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="sea-plants-canvas"
      aria-hidden
      style={{ height: HERO_SEAWEED.canvasHeight }}
    />
  )
}

// ── Floating logo ──
function FloatingLogo() {
  return (
    <div className="floating-logo-wrap">
      <img src={logo} alt="FishNet" className="floating-logo-img" />
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

      <BackgroundJellyfish />

      <div className="hero-center">
        <FloatingLogo />
      </div>
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
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

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

      </main>
    </>
  )
}