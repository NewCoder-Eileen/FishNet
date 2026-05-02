import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'

const WORLD_W   = 3200
const WORLD_H   = 2200
const MAX_SPEED = 5
const ACCEL     = 0.55
const FRICTION  = 0.88

// ── Static world decorations ──
const SEAWEED = Array.from({ length: 55 }, () => ({
  x:      40 + Math.random() * (WORLD_W - 80),
  height: 50 + Math.random() * 130,
  phase:  Math.random() * Math.PI * 2,
  speed:  0.6 + Math.random() * 0.8,
  hue:    130 + Math.random() * 60,
  sat:    45  + Math.random() * 25,
  thick:  3   + Math.random() * 4,
}))

const CORAL = Array.from({ length: 25 }, () => ({
  x:    40 + Math.random() * (WORLD_W - 80),
  size: 14 + Math.random() * 32,
  hue:  Math.random() > 0.5 ? 345 : 22,
  type: Math.floor(Math.random() * 3),
}))

const BUBBLES = Array.from({ length: 65 }, () => ({
  x:       Math.random() * WORLD_W,
  y:       Math.random() * WORLD_H,
  r:       2  + Math.random() * 16,
  speed:   0.18 + Math.random() * 1.1,
  wobble:  Math.random() * Math.PI * 2,
  opacity: 0.25 + Math.random() * 0.45,
}))

// ── Drawing helpers ──
function drawSeaweed(ctx, sw, time) {
  const segs = Math.max(4, Math.floor(sw.height / 18))
  ctx.lineWidth  = sw.thick
  ctx.lineCap    = 'round'
  ctx.lineJoin   = 'round'
  ctx.strokeStyle = `hsla(${sw.hue}, ${sw.sat}%, 52%, 0.82)`
  ctx.beginPath()
  for (let i = 0; i <= segs; i++) {
    const t    = i / segs
    const y    = WORLD_H - 60 - sw.height * t
    const sway = Math.sin(time * 0.001 * sw.speed + sw.phase + i * 0.65) * 16 * t
    i === 0 ? ctx.moveTo(sw.x + sway, y) : ctx.lineTo(sw.x + sway, y)
  }
  ctx.stroke()

  // Little leaf nubs every other segment
  for (let i = 1; i < segs; i += 2) {
    const t    = i / segs
    const y    = WORLD_H - 60 - sw.height * t
    const sway = Math.sin(time * 0.001 * sw.speed + sw.phase + i * 0.65) * 16 * t
    const dir  = i % 4 === 1 ? 1 : -1
    ctx.beginPath()
    ctx.ellipse(sw.x + sway + dir * 8, y - 4, 8, 4, dir * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${sw.hue}, ${sw.sat}%, 48%, 0.55)`
    ctx.fill()
  }
}

function drawCoral(ctx, c) {
  const y = WORLD_H - 60
  ctx.lineCap = 'round'
  if (c.type === 0) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.8 + (i / 6) * Math.PI * 1.6
      ctx.beginPath()
      ctx.moveTo(c.x, y)
      ctx.lineTo(c.x + Math.cos(a) * c.size, y + Math.sin(a) * c.size)
      ctx.lineWidth   = 3.5
      ctx.strokeStyle = `hsla(${c.hue}, 75%, 62%, 0.85)`
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(c.x + Math.cos(a) * c.size, y + Math.sin(a) * c.size, 4, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${c.hue}, 80%, 72%, 0.8)`
      ctx.fill()
    }
  } else if (c.type === 1) {
    for (let i = 0; i < 6; i++) {
      const a  = (i / 5) * Math.PI
      const bx = c.x + Math.cos(a) * c.size * 0.55
      const by = y    - Math.sin(a) * c.size * 0.7
      ctx.beginPath(); ctx.arc(bx, by, c.size * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${c.hue}, 70%, 62%, 0.72)`; ctx.fill()
    }
  } else {
    function branch(bx, by, len, angle, depth) {
      if (depth === 0 || len < 5) return
      const ex = bx + Math.cos(angle) * len
      const ey = by + Math.sin(angle) * len
      ctx.lineWidth   = depth * 1.3
      ctx.strokeStyle = `hsla(${c.hue}, 70%, 58%, 0.82)`
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke()
      branch(ex, ey, len * 0.65, angle - 0.45, depth - 1)
      branch(ex, ey, len * 0.65, angle + 0.45, depth - 1)
    }
    branch(c.x, y, c.size, -Math.PI / 2, 4)
  }
}

function drawFish(ctx, x, y, angle, tailPhase) {
  const goingLeft = Math.cos(angle) < 0
  ctx.save()
  ctx.translate(x, y)
  if (goingLeft) { ctx.scale(-1, 1); ctx.rotate(Math.PI - angle) }
  else            { ctx.rotate(angle) }

  const wag = Math.sin(tailPhase) * 0.45

  // Tail
  ctx.save()
  ctx.translate(-26, 0); ctx.rotate(wag)
  ctx.beginPath()
  ctx.moveTo(4, 0); ctx.lineTo(-15, -14); ctx.lineTo(-15, 14); ctx.closePath()
  const tg = ctx.createLinearGradient(-15, 0, 4, 0)
  tg.addColorStop(0, 'rgba(80, 40, 200, 0.8)')
  tg.addColorStop(1, 'rgba(170, 130, 255, 0.95)')
  ctx.fillStyle = tg; ctx.fill()
  ctx.restore()

  // Body glow
  ctx.save()
  ctx.shadowColor = 'rgba(180, 140, 255, 0.6)'; ctx.shadowBlur = 18
  ctx.beginPath(); ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2)
  const bg = ctx.createRadialGradient(-4, -5, 2, 0, 0, 30)
  bg.addColorStop(0,   'rgba(240, 220, 255, 0.98)')
  bg.addColorStop(0.5, 'rgba(170, 130, 255, 0.95)')
  bg.addColorStop(1,   'rgba(100, 60, 215, 0.9)')
  ctx.fillStyle = bg; ctx.fill()
  ctx.restore()

  ctx.strokeStyle = 'rgba(200, 170, 255, 0.35)'; ctx.lineWidth = 1; ctx.stroke()

  // Dorsal fin
  ctx.beginPath()
  ctx.moveTo(-8, -14); ctx.quadraticCurveTo(4, -27, 16, -14); ctx.closePath()
  ctx.fillStyle = 'rgba(160, 120, 255, 0.65)'; ctx.fill()

  // Pectoral fin
  ctx.beginPath(); ctx.ellipse(2, 9, 12, 5, 0.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(160, 120, 255, 0.4)'; ctx.fill()

  // Eye
  ctx.beginPath(); ctx.arc(16, -3, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.beginPath(); ctx.arc(17, -3, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#100828'; ctx.fill()
  ctx.beginPath(); ctx.arc(18.2, -4.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()

  ctx.restore()
}

function drawWorld(ctx, time) {
  // Deep ocean background
  const bg = ctx.createLinearGradient(0, 0, 0, WORLD_H)
  bg.addColorStop(0,    '#1a3878')
  bg.addColorStop(0.35, '#0e2258')
  bg.addColorStop(0.7,  '#080f30')
  bg.addColorStop(1,    '#030818')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)

  // Subtle light rays from surface
  ctx.save()
  ctx.globalAlpha = 0.04
  for (let i = 0; i < 12; i++) {
    const rx = (WORLD_W / 12) * i + Math.sin(time * 0.00022 + i) * 55
    ctx.beginPath()
    ctx.moveTo(rx, 0); ctx.lineTo(rx - 120, WORLD_H); ctx.lineTo(rx + 120, WORLD_H); ctx.closePath()
    ctx.fillStyle = '#8ab4ff'; ctx.fill()
  }
  ctx.restore()

  // Caustic shimmer near top
  ctx.save()
  ctx.globalAlpha = 0.035
  for (let i = 0; i < 18; i++) {
    const cx = (Math.sin(time * 0.0005 + i * 1.7) * 0.5 + 0.5) * WORLD_W
    const cy = (Math.sin(time * 0.0004 + i * 2.3) * 0.5 + 0.5) * WORLD_H * 0.4
    const r  = 40 + Math.sin(time * 0.001 + i) * 20
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    grad.addColorStop(0, '#a0c8ff'); grad.addColorStop(1, 'transparent')
    ctx.fillStyle = grad
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()

  // Sand / seafloor
  const sand = ctx.createLinearGradient(0, WORLD_H - 70, 0, WORLD_H)
  sand.addColorStop(0,   'rgba(80, 65, 45, 0)')
  sand.addColorStop(0.3, 'rgba(70, 58, 38, 0.8)')
  sand.addColorStop(1,   'rgba(55, 45, 28, 0.95)')
  ctx.fillStyle = sand
  ctx.fillRect(0, WORLD_H - 70, WORLD_W, 70)

  // Coral
  for (const c of CORAL) { ctx.save(); drawCoral(ctx, c); ctx.restore() }

  // Seaweed
  for (const sw of SEAWEED) { ctx.save(); drawSeaweed(ctx, sw, time); ctx.restore() }

  // Bubbles
  for (const b of BUBBLES) {
    const by = ((b.y - time * b.speed * 0.032) % (WORLD_H + 80) + WORLD_H + 80) % (WORLD_H + 80)
    const bx = b.x + Math.sin(time * 0.0007 + b.wobble) * 20

    // Bubble body
    ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(140, 180, 255, ${b.opacity})`
    ctx.lineWidth = 1.2; ctx.stroke()

    // Inner fill
    ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(180, 210, 255, ${b.opacity * 0.15})`; ctx.fill()

    // Shine highlight
    ctx.beginPath()
    ctx.arc(bx - b.r * 0.33, by - b.r * 0.33, b.r * 0.32, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255, 255, 255, ${b.opacity * 0.65})`; ctx.fill()
  }

  // World boundary — soft glowing edge
  ctx.save()
  ctx.shadowColor = 'rgba(80, 120, 255, 0.6)'; ctx.shadowBlur = 28
  ctx.strokeStyle = 'rgba(80, 120, 255, 0.35)'; ctx.lineWidth = 8
  ctx.strokeRect(4, 4, WORLD_W - 8, WORLD_H - 8)
  ctx.restore()
}

// ── Component ──
export default function EventPage() {
  const { code }      = useParams()
  const navigate      = useNavigate()
  const location      = useLocation()
  const canvasRef     = useRef(null)
  const eventName     = location.state?.name || code

  const [showWelcome, setShowWelcome] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 3500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const state = {
      fish: { x: WORLD_W / 2, y: WORLD_H / 2, vx: 0, vy: 0, angle: 0, tailPhase: 0 },
      cam:  { x: WORLD_W / 2 - window.innerWidth / 2, y: WORLD_H / 2 - window.innerHeight / 2 },
      keys: {},
    }

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    function onKeyDown(e) {
      state.keys[e.key] = true
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
    }
    function onKeyUp(e) { state.keys[e.key] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)

    let animId

    function loop(ts) {
      const { fish, cam, keys } = state
      const W = canvas.width, H = canvas.height

      const left  = keys['ArrowLeft']  || keys['a'] || keys['A']
      const right = keys['ArrowRight'] || keys['d'] || keys['D']
      const up    = keys['ArrowUp']    || keys['w'] || keys['W']
      const down  = keys['ArrowDown']  || keys['s'] || keys['S']

      if (left)  fish.vx -= ACCEL
      if (right) fish.vx += ACCEL
      if (up)    fish.vy -= ACCEL
      if (down)  fish.vy += ACCEL

      fish.vx *= FRICTION; fish.vy *= FRICTION
      const spd = Math.hypot(fish.vx, fish.vy)
      if (spd > MAX_SPEED) { fish.vx = (fish.vx / spd) * MAX_SPEED; fish.vy = (fish.vy / spd) * MAX_SPEED }

      fish.x = Math.max(35, Math.min(WORLD_W - 35, fish.x + fish.vx))
      fish.y = Math.max(35, Math.min(WORLD_H - 35, fish.y + fish.vy))
      if (spd > 0.15) fish.angle = Math.atan2(fish.vy, fish.vx)
      fish.tailPhase += 0.07 + spd * 0.05

      cam.x += ((fish.x - W / 2) - cam.x) * 0.09
      cam.y += ((fish.y - H / 2) - cam.y) * 0.09
      cam.x  = Math.max(0, Math.min(WORLD_W - W, cam.x))
      cam.y  = Math.max(0, Math.min(WORLD_H - H, cam.y))

      ctx.clearRect(0, 0, W, H)
      ctx.save()
      ctx.translate(-(cam.x | 0), -(cam.y | 0))
      drawWorld(ctx, ts)
      drawFish(ctx, fish.x, fish.y, fish.angle, fish.tailPhase)
      ctx.restore()

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize',  resize)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
      <Navbar dark />

      {/* Welcome message */}
      {showWelcome && (
        <div className="welcome-toast">
          🐟 Welcome to <strong>{eventName}</strong>!
        </div>
      )}

      <div className="event-hud-code">
        <span className="hud-event-name">{eventName}</span>
        &nbsp;·&nbsp; {code} &nbsp;·&nbsp; WASD / ↑↓←→ to swim
      </div>

      <button className="event-leave-btn" onClick={() => navigate('/')}>
        ← Leave
      </button>
    </div>
  )
}