import { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

const WORLD_W  = 3200
const WORLD_H  = 2200
const MAX_SPEED = 5
const ACCEL     = 0.55
const FRICTION  = 0.88

// ── Static decorations (generated once per module load) ──
const SEAWEED = Array.from({ length: 45 }, () => ({
  x:      40 + Math.random() * (WORLD_W - 80),
  height: 55 + Math.random() * 110,
  phase:  Math.random() * Math.PI * 2,
  hue:    135 + Math.random() * 55,
}))

const CORAL = Array.from({ length: 22 }, () => ({
  x:    40 + Math.random() * (WORLD_W - 80),
  size: 16 + Math.random() * 30,
  hue:  Math.random() > 0.5 ? 345 : 22,
  type: Math.floor(Math.random() * 3),
}))

const AMBIENT = Array.from({ length: 28 }, () => ({
  x:      Math.random() * WORLD_W,
  y:      Math.random() * WORLD_H,
  r:      4 + Math.random() * 10,
  speed:  0.25 + Math.random() * 0.55,
  wobble: Math.random() * Math.PI * 2,
}))

// ── Drawing helpers ──
function drawSeaweed(ctx, sw, time) {
  const segs = Math.max(3, Math.floor(sw.height / 22))
  const segH = sw.height / segs
  ctx.lineWidth = 5
  ctx.strokeStyle = `hsla(${sw.hue}, 55%, 38%, 0.75)`
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  for (let i = 0; i <= segs; i++) {
    const t   = i / segs
    const y   = WORLD_H - 55 - sw.height * t
    const sway = Math.sin(time * 0.001 + sw.phase + i * 0.7) * 14 * t
    i === 0 ? ctx.moveTo(sw.x + sway, y) : ctx.lineTo(sw.x + sway, y)
  }
  ctx.stroke()
}

function drawCoral(ctx, c) {
  const y = WORLD_H - 55
  ctx.lineCap = 'round'
  if (c.type === 0) {
    // fan
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.8 + (i / 6) * Math.PI * 1.6
      ctx.beginPath()
      ctx.moveTo(c.x, y)
      ctx.lineTo(c.x + Math.cos(a) * c.size, y + Math.sin(a) * c.size)
      ctx.lineWidth = 3
      ctx.strokeStyle = `hsla(${c.hue}, 70%, 60%, 0.8)`
      ctx.stroke()
    }
  } else if (c.type === 1) {
    // bubble cluster
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI + (i / 4) * Math.PI
      const bx = c.x + Math.cos(a) * c.size * 0.5
      const by = y + Math.sin(a) * c.size * 0.5 - c.size * 0.3
      ctx.beginPath()
      ctx.arc(bx, by, c.size * 0.3, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${c.hue}, 75%, 65%, 0.7)`
      ctx.fill()
    }
  } else {
    // branch
    function branch(bx, by, len, angle, depth) {
      if (depth === 0 || len < 5) return
      const ex = bx + Math.cos(angle) * len
      const ey = by + Math.sin(angle) * len
      ctx.lineWidth = depth * 1.2
      ctx.strokeStyle = `hsla(${c.hue}, 70%, 60%, 0.8)`
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
  ctx.translate(-26, 0)
  ctx.rotate(wag)
  ctx.beginPath()
  ctx.moveTo(4, 0); ctx.lineTo(-15, -14); ctx.lineTo(-15, 14); ctx.closePath()
  const tg = ctx.createLinearGradient(-15, 0, 4, 0)
  tg.addColorStop(0, 'rgba(100, 60, 210, 0.75)')
  tg.addColorStop(1, 'rgba(180, 140, 255, 0.9)')
  ctx.fillStyle = tg; ctx.fill()
  ctx.restore()

  // Body
  const bg = ctx.createRadialGradient(-4, -5, 2, 0, 0, 30)
  bg.addColorStop(0,   'rgba(240, 220, 255, 0.98)')
  bg.addColorStop(0.5, 'rgba(175, 135, 255, 0.95)')
  bg.addColorStop(1,   'rgba(105, 65, 220, 0.9)')
  ctx.beginPath()
  ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2)
  ctx.fillStyle = bg; ctx.fill()
  ctx.strokeStyle = 'rgba(200, 170, 255, 0.4)'; ctx.lineWidth = 1; ctx.stroke()

  // Dorsal fin
  ctx.beginPath()
  ctx.moveTo(-8, -14); ctx.quadraticCurveTo(4, -27, 16, -14); ctx.closePath()
  ctx.fillStyle = 'rgba(165, 125, 255, 0.65)'; ctx.fill()

  // Pectoral fin
  ctx.beginPath()
  ctx.ellipse(2, 9, 12, 5, 0.5, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(165, 125, 255, 0.4)'; ctx.fill()

  // Eye
  ctx.beginPath(); ctx.arc(16, -3, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.beginPath(); ctx.arc(17, -3, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#180830'; ctx.fill()
  ctx.beginPath(); ctx.arc(18.2, -4.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()

  ctx.restore()
}

function drawWorld(ctx, time) {
  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, WORLD_H)
  bg.addColorStop(0,    '#ede6ff')
  bg.addColorStop(0.55, '#ccdeff')
  bg.addColorStop(1,    '#b8d2f5')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, WORLD_W, WORLD_H)

  // Light rays
  ctx.save()
  ctx.globalAlpha = 0.045
  for (let i = 0; i < 10; i++) {
    const rx = (WORLD_W / 10) * i + Math.sin(time * 0.00025 + i) * 45
    ctx.beginPath()
    ctx.moveTo(rx, 0); ctx.lineTo(rx - 110, WORLD_H); ctx.lineTo(rx + 110, WORLD_H); ctx.closePath()
    ctx.fillStyle = '#fff'; ctx.fill()
  }
  ctx.restore()

  // Sand
  const sand = ctx.createLinearGradient(0, WORLD_H - 65, 0, WORLD_H)
  sand.addColorStop(0,   'rgba(228, 208, 175, 0)')
  sand.addColorStop(0.3, 'rgba(218, 198, 160, 0.75)')
  sand.addColorStop(1,   'rgba(208, 185, 145, 0.95)')
  ctx.fillStyle = sand
  ctx.fillRect(0, WORLD_H - 65, WORLD_W, 65)

  // Coral
  for (const c of CORAL) { ctx.save(); drawCoral(ctx, c); ctx.restore() }

  // Seaweed
  for (const sw of SEAWEED) { ctx.save(); drawSeaweed(ctx, sw, time); ctx.restore() }

  // Ambient bubbles
  for (const b of AMBIENT) {
    const by = ((b.y - time * b.speed * 0.028) % (WORLD_H + 60) + WORLD_H + 60) % (WORLD_H + 60)
    const bx = b.x + Math.sin(time * 0.0007 + b.wobble) * 18
    ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(170, 160, 235, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke()
    ctx.beginPath(); ctx.arc(bx - b.r * 0.32, by - b.r * 0.32, b.r * 0.32, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255,255,255,0.38)'; ctx.fill()
  }

  // World boundary glow
  ctx.save()
  ctx.shadowColor = 'rgba(130, 90, 255, 0.45)'; ctx.shadowBlur = 22
  ctx.strokeStyle = 'rgba(150, 110, 255, 0.38)'; ctx.lineWidth = 7
  ctx.strokeRect(4, 4, WORLD_W - 8, WORLD_H - 8)
  ctx.restore()
}

// ── Component ──
export default function EventPage() {
  const { code } = useParams()
  const navigate  = useNavigate()
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const state = {
      fish: {
        x: WORLD_W / 2, y: WORLD_H / 2,
        vx: 0, vy: 0, angle: 0, tailPhase: 0,
      },
      cam:  { x: WORLD_W / 2 - window.innerWidth / 2, y: WORLD_H / 2 - window.innerHeight / 2 },
      keys: {},
    }

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
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

      fish.vx *= FRICTION
      fish.vy *= FRICTION

      const spd = Math.hypot(fish.vx, fish.vy)
      if (spd > MAX_SPEED) {
        fish.vx = (fish.vx / spd) * MAX_SPEED
        fish.vy = (fish.vy / spd) * MAX_SPEED
      }

      fish.x = Math.max(35, Math.min(WORLD_W - 35, fish.x + fish.vx))
      fish.y = Math.max(35, Math.min(WORLD_H - 35, fish.y + fish.vy))

      if (spd > 0.15) fish.angle = Math.atan2(fish.vy, fish.vx)
      fish.tailPhase += 0.07 + spd * 0.05

      // Smooth camera follow
      cam.x += ((fish.x - W / 2) - cam.x) * 0.09
      cam.y += ((fish.y - H / 2) - cam.y) * 0.09
      cam.x  = Math.max(0, Math.min(WORLD_W - W, cam.x))
      cam.y  = Math.max(0, Math.min(WORLD_H - H, cam.y))

      // Draw
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

      <div className="event-hud-code">
        Event: <strong>{code}</strong>&nbsp;&nbsp;·&nbsp;&nbsp;WASD / arrow keys to swim
      </div>

      <button className="event-leave-btn" onClick={() => navigate('/')}>
        ← Leave
      </button>
    </div>
  )
}