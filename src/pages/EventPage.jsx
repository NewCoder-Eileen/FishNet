import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { WORLD, MOVEMENT } from '../aquarium/assets'
import { generateDecorations, drawBackground, drawBorder, drawSeaweed, drawCoral, drawBubble, drawFish } from '../aquarium/draw'

const { width: WORLD_W, height: WORLD_H } = WORLD
const { maxSpeed: MAX_SPEED, accel: ACCEL, friction: FRICTION } = MOVEMENT

// Generated once per session — replaced by importing custom sprites in assets.js
const DECO = generateDecorations()

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

      drawBackground(ctx, WORLD_W, WORLD_H, ts)
      for (const c  of DECO.coral)   { ctx.save(); drawCoral(ctx, c);        ctx.restore() }
      for (const sw of DECO.seaweed) { ctx.save(); drawSeaweed(ctx, sw, ts); ctx.restore() }
      for (const b  of DECO.bubbles) { drawBubble(ctx, b, ts) }
      drawBorder(ctx, WORLD_W, WORLD_H)
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