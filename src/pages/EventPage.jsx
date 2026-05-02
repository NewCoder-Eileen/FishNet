import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { WORLD, MOVEMENT } from '../aquarium/assets'
import { generateDecorations, drawBackground, drawBorder, drawSeaweed, drawCoral, drawBubble } from '../aquarium/draw'
import { loadProfile } from '../lib/profile'
import { MOCK_PROFILES } from '../data/mockProfiles'
import { proximityScore } from '../lib/proximity'

const { width: WORLD_W, height: WORLD_H } = WORLD
const { maxSpeed: MAX_SPEED, accel: ACCEL, friction: FRICTION } = MOVEMENT

// ── Network proximity params ──
const MIN_RADIUS = 130    // ideal distance for highest-scoring fish
const MAX_RADIUS = 720    // ideal distance for lowest-scoring fish
const ATTRACT    = 0.0014
const REPULSE_R  = 70
const REPULSE_K  = 0.55
const OTHER_FRIC = 0.92
const THREAD_TH  = 0.18

// World decorations (seaweed/coral/bubbles) generated once per session
const DECO = generateDecorations()

// Local hue-aware fish drawing — each profile gets a distinct color.
// Intentionally separate from aquarium/draw.js's drawFish (which is fixed-color).
function drawFish(ctx, fish) {
  const { x, y, angle, tailPhase, scale = 1, hue = 270 } = fish
  const goingLeft = Math.cos(angle) < 0
  ctx.save()
  ctx.translate(x, y)
  if (goingLeft) { ctx.scale(-1, 1); ctx.rotate(Math.PI - angle) }
  else            { ctx.rotate(angle) }
  ctx.scale(scale, scale)

  const wag = Math.sin(tailPhase) * 0.45

  // Tail
  ctx.save()
  ctx.translate(-26, 0)
  ctx.rotate(wag)
  ctx.beginPath()
  ctx.moveTo(4, 0); ctx.lineTo(-15, -14); ctx.lineTo(-15, 14); ctx.closePath()
  const tg = ctx.createLinearGradient(-15, 0, 4, 0)
  tg.addColorStop(0, `hsla(${hue}, 70%, 55%, 0.75)`)
  tg.addColorStop(1, `hsla(${hue}, 80%, 78%, 0.9)`)
  ctx.fillStyle = tg; ctx.fill()
  ctx.restore()

  // Body
  const bg = ctx.createRadialGradient(-4, -5, 2, 0, 0, 30)
  bg.addColorStop(0,   `hsla(${hue}, 100%, 92%, 0.98)`)
  bg.addColorStop(0.5, `hsla(${hue}, 70%, 72%, 0.95)`)
  bg.addColorStop(1,   `hsla(${hue}, 70%, 50%, 0.9)`)
  ctx.beginPath()
  ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2)
  ctx.fillStyle   = bg; ctx.fill()
  ctx.strokeStyle = `hsla(${hue}, 50%, 75%, 0.4)`
  ctx.lineWidth = 1; ctx.stroke()

  // Dorsal fin
  ctx.beginPath()
  ctx.moveTo(-8, -14); ctx.quadraticCurveTo(4, -27, 16, -14); ctx.closePath()
  ctx.fillStyle = `hsla(${hue}, 70%, 65%, 0.65)`; ctx.fill()

  // Pectoral fin
  ctx.beginPath()
  ctx.ellipse(2, 9, 12, 5, 0.5, 0, Math.PI * 2)
  ctx.fillStyle = `hsla(${hue}, 70%, 65%, 0.4)`; ctx.fill()

  // Eye
  ctx.beginPath(); ctx.arc(16, -3, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.beginPath(); ctx.arc(17, -3, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#180830'; ctx.fill()
  ctx.beginPath(); ctx.arc(18.2, -4.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()

  ctx.restore()
}

function drawNameplate(ctx, fish) {
  if (!fish.name) return
  ctx.save()
  ctx.font = '600 13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const w = ctx.measureText(fish.name).width + 16
  const px = fish.x
  const py = fish.y - 32
  ctx.fillStyle = `hsla(${fish.hue || 270}, 60%, 96%, 0.78)`
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(px - w / 2, py - 13, w, 18, 9)
    ctx.fill()
  } else {
    ctx.fillRect(px - w / 2, py - 13, w, 18)
  }
  ctx.fillStyle = `hsla(${fish.hue || 270}, 50%, 28%, 0.95)`
  ctx.fillText(fish.name, px, py)
  ctx.restore()
}

function drawThread(ctx, ax, ay, bx, by, hueA, hueB, score, time, seed) {
  const alpha = 0.18 + score * 0.55
  const dx = bx - ax
  const dy = by - ay
  const len = Math.hypot(dx, dy) || 1
  const px = -dy / len
  const py = dx / len
  const wave = Math.sin(time * 0.0011 + seed) * len * 0.07
  const cpX = (ax + bx) / 2 + px * wave
  const cpY = (ay + by) / 2 + py * wave

  const grad = ctx.createLinearGradient(ax, ay, bx, by)
  grad.addColorStop(0, `hsla(${hueA}, 85%, 75%, ${alpha})`)
  grad.addColorStop(1, `hsla(${hueB}, 85%, 75%, ${alpha})`)

  ctx.save()
  ctx.shadowColor = `hsla(${(hueA + hueB) / 2}, 85%, 70%, ${alpha})`
  ctx.shadowBlur  = 8 + score * 12
  ctx.strokeStyle = grad
  ctx.lineWidth   = 1 + score * 3
  ctx.lineCap     = 'round'
  ctx.beginPath()
  ctx.moveTo(ax, ay)
  ctx.quadraticCurveTo(cpX, cpY, bx, by)
  ctx.stroke()
  ctx.restore()
}

export default function EventPage() {
  const { code }  = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()
  const canvasRef = useRef(null)
  const eventName = location.state?.name || code

  const [showWelcome, setShowWelcome] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 3500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    const me = loadProfile()
    const myHue = 270

    // Score every mock profile against me; arrange initially in a ring at target distance
    const others = MOCK_PROFILES.map((p, i) => {
      const score      = proximityScore(me, p)
      const targetDist = MAX_RADIUS - score * (MAX_RADIUS - MIN_RADIUS)
      const ringAngle  = (i / MOCK_PROFILES.length) * Math.PI * 2
      return {
        ...p,
        x:         WORLD_W / 2 + Math.cos(ringAngle) * targetDist,
        y:         WORLD_H / 2 + Math.sin(ringAngle) * targetDist,
        vx: 0, vy: 0,
        angle:     ringAngle + Math.PI,
        tailPhase: Math.random() * Math.PI * 2,
        scale:     0.85 + score * 0.35,
        score,
        targetDist,
        seed:      Math.random() * 1000,
      }
    })

    const state = {
      player: {
        x: WORLD_W / 2, y: WORLD_H / 2,
        vx: 0, vy: 0, angle: 0, tailPhase: 0,
        hue: myHue, scale: 1.15,
        name: me.name || 'You',
      },
      others,
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
      const { player, others, cam, keys } = state
      const W = canvas.width, H = canvas.height

      // ── Player input ──
      const left  = keys['ArrowLeft']  || keys['a'] || keys['A']
      const right = keys['ArrowRight'] || keys['d'] || keys['D']
      const up    = keys['ArrowUp']    || keys['w'] || keys['W']
      const down  = keys['ArrowDown']  || keys['s'] || keys['S']

      if (left)  player.vx -= ACCEL
      if (right) player.vx += ACCEL
      if (up)    player.vy -= ACCEL
      if (down)  player.vy += ACCEL

      player.vx *= FRICTION
      player.vy *= FRICTION

      const pSpd = Math.hypot(player.vx, player.vy)
      if (pSpd > MAX_SPEED) {
        player.vx = (player.vx / pSpd) * MAX_SPEED
        player.vy = (player.vy / pSpd) * MAX_SPEED
      }

      player.x = Math.max(35, Math.min(WORLD_W - 35, player.x + player.vx))
      player.y = Math.max(35, Math.min(WORLD_H - 35, player.y + player.vy))

      if (pSpd > 0.15) player.angle = Math.atan2(player.vy, player.vx)
      player.tailPhase += 0.07 + pSpd * 0.05

      // ── Other-fish proximity forces ──
      for (const o of others) {
        const dx   = player.x - o.x
        const dy   = player.y - o.y
        const dist = Math.hypot(dx, dy) || 1
        const ndx  = dx / dist
        const ndy  = dy / dist

        // Spring toward "ideal distance" point along the line to player
        const targetX = player.x - ndx * o.targetDist
        const targetY = player.y - ndy * o.targetDist
        o.vx += (targetX - o.x) * ATTRACT
        o.vy += (targetY - o.y) * ATTRACT

        // Soft repulsion from other fish to prevent clumping
        for (const o2 of others) {
          if (o2 === o) continue
          const ddx = o.x - o2.x
          const ddy = o.y - o2.y
          const dd  = Math.hypot(ddx, ddy)
          if (dd > 0 && dd < REPULSE_R) {
            const f = (REPULSE_R - dd) / REPULSE_R * REPULSE_K
            o.vx += (ddx / dd) * f
            o.vy += (ddy / dd) * f
          }
        }

        // Don't crowd directly onto the player
        const minOk = Math.max(MIN_RADIUS * 0.7, 80)
        if (dist < minOk) {
          const f = (minOk - dist) / minOk * 0.5
          o.vx -= ndx * f
          o.vy -= ndy * f
        }

        o.vx *= OTHER_FRIC
        o.vy *= OTHER_FRIC

        o.x = Math.max(35, Math.min(WORLD_W - 35, o.x + o.vx))
        o.y = Math.max(35, Math.min(WORLD_H - 35, o.y + o.vy))

        const oSpd = Math.hypot(o.vx, o.vy)
        if (oSpd > 0.04) o.angle = Math.atan2(o.vy, o.vx)
        o.tailPhase += 0.05 + oSpd * 0.08
      }

      // ── Camera follow ──
      cam.x += ((player.x - W / 2) - cam.x) * 0.09
      cam.y += ((player.y - H / 2) - cam.y) * 0.09
      cam.x = Math.max(0, Math.min(WORLD_W - W, cam.x))
      cam.y = Math.max(0, Math.min(WORLD_H - H, cam.y))

      // ── Render ──
      ctx.clearRect(0, 0, W, H)
      ctx.save()
      ctx.translate(-(cam.x | 0), -(cam.y | 0))

      // World (background, coral, seaweed, bubbles, border) — from shared aquarium/draw.js
      drawBackground(ctx, WORLD_W, WORLD_H, ts)
      for (const c  of DECO.coral)   { ctx.save(); drawCoral(ctx, c);        ctx.restore() }
      for (const sw of DECO.seaweed) { ctx.save(); drawSeaweed(ctx, sw, ts); ctx.restore() }
      for (const b  of DECO.bubbles) { drawBubble(ctx, b, ts) }
      drawBorder(ctx, WORLD_W, WORLD_H)

      // Glowing threads — drawn behind fish
      for (const o of others) {
        if (o.score < THREAD_TH) continue
        drawThread(ctx, player.x, player.y, o.x, o.y, player.hue, o.hue, o.score, ts, o.seed)
      }

      // Other fish + nameplates
      for (const o of others) {
        drawFish(ctx, o)
        drawNameplate(ctx, o)
      }

      // Player on top
      drawFish(ctx, player)
      drawNameplate(ctx, player)

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
