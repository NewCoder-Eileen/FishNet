import { useEffect, useRef } from 'react'

const NUM_FISH    = 11
const NUM_BUBBLES = 22

// ±20° vertical wobble — fish stay mostly horizontal
const WOBBLE = Math.PI * 0.22
// Chance per turn to flip direction
const FLIP_CHANCE = 0.1

function pickHorizontalAngle(currentAngle) {
  const goingRight = Math.cos(currentAngle) >= 0
  const flip = Math.random() < FLIP_CHANCE
  const facingRight = flip ? !goingRight : goingRight
  const base = facingRight ? 0 : Math.PI
  return base + (Math.random() - 0.5) * WOBBLE
}

function makeBubbles(width, height) {
  return Array.from({ length: NUM_BUBBLES }, () => ({
    x:      Math.random() * width,
    y:      Math.random() * height,
    r:      3 + Math.random() * 8,
    speed:  0.25 + Math.random() * 0.5,
    wobble: Math.random() * Math.PI * 2,
  }))
}

function makeFish(width, height) {
  return Array.from({ length: NUM_FISH }, () => {
    const goingRight = Math.random() < 0.5
    const base = goingRight ? 0 : Math.PI
    const angle = base + (Math.random() - 0.5) * WOBBLE * 0.7
    return {
      x:           Math.random() * width,
      y:           30 + Math.random() * Math.max(60, height - 60),
      angle,
      targetAngle: angle,
      nextTurn:    1500 + Math.random() * 3000,
      speed:       0.6 + Math.random() * 0.9,
      tailPhase:   Math.random() * Math.PI * 2,
      scale:       0.55 + Math.random() * 0.6,
      hue:         220 + Math.random() * 110, // blue-purple → pink
    }
  })
}

function drawFish(ctx, fish) {
  const { x, y, angle, tailPhase, scale, hue } = fish
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
  bg.addColorStop(1,   `hsla(${hue}, 70%, 55%, 0.9)`)
  ctx.beginPath()
  ctx.ellipse(0, 0, 28, 14, 0, 0, Math.PI * 2)
  ctx.fillStyle   = bg; ctx.fill()
  ctx.strokeStyle = `hsla(${hue}, 50%, 78%, 0.4)`
  ctx.lineWidth   = 1; ctx.stroke()

  // Dorsal fin
  ctx.beginPath()
  ctx.moveTo(-8, -14); ctx.quadraticCurveTo(4, -27, 16, -14); ctx.closePath()
  ctx.fillStyle = `hsla(${hue}, 70%, 67%, 0.65)`; ctx.fill()

  // Pectoral fin
  ctx.beginPath()
  ctx.ellipse(2, 9, 12, 5, 0.5, 0, Math.PI * 2)
  ctx.fillStyle = `hsla(${hue}, 70%, 67%, 0.4)`; ctx.fill()

  // Eye
  ctx.beginPath(); ctx.arc(16, -3, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.beginPath(); ctx.arc(17, -3, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#180830'; ctx.fill()
  ctx.beginPath(); ctx.arc(18.2, -4.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()

  ctx.restore()
}

export default function AquariumScene() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx    = canvas.getContext('2d')

    let width  = canvas.width  = canvas.clientWidth  || window.innerWidth
    let height = canvas.height = canvas.clientHeight || window.innerHeight

    let bubbles = makeBubbles(width, height)
    const fish  = makeFish(width, height)

    function resize() {
      width   = canvas.width  = canvas.clientWidth
      height  = canvas.height = canvas.clientHeight
      bubbles = makeBubbles(width, height)
      for (const f of fish) {
        if (f.x > width)        f.x = width
        if (f.y > height - 30)  f.y = height - 30
      }
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let last  = performance.now()
    let animId

    function loop(ts) {
      const dt = Math.min(50, ts - last)
      last = ts

      // Background gradient
      const bg = ctx.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0,    '#ede6ff')
      bg.addColorStop(0.55, '#ccdeff')
      bg.addColorStop(1,    '#b8d2f5')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // Light rays
      ctx.save()
      ctx.globalAlpha = 0.05
      const rays = Math.max(6, Math.floor(width / 180))
      for (let i = 0; i < rays; i++) {
        const rx = (width / rays) * i + Math.sin(ts * 0.00025 + i) * 35
        ctx.beginPath()
        ctx.moveTo(rx, 0)
        ctx.lineTo(rx - 90, height)
        ctx.lineTo(rx + 90, height)
        ctx.closePath()
        ctx.fillStyle = '#fff'; ctx.fill()
      }
      ctx.restore()

      // Fish: update + draw
      for (const f of fish) {
        // Steer toward target angle (shortest direction)
        let diff = f.targetAngle - f.angle
        while (diff >  Math.PI) diff -= Math.PI * 2
        while (diff < -Math.PI) diff += Math.PI * 2
        f.angle += diff * 0.025

        // Periodically pick a new heading — biased horizontal
        f.nextTurn -= dt
        if (f.nextTurn <= 0) {
          f.targetAngle = pickHorizontalAngle(f.angle)
          f.nextTurn = 1500 + Math.random() * 3000
        }

        // Move
        f.x += Math.cos(f.angle) * f.speed
        f.y += Math.sin(f.angle) * f.speed
        f.tailPhase += 0.08 + f.speed * 0.04

        // Wrap horizontally
        if (f.x < -50)        f.x = width + 50
        if (f.x > width + 50) f.x = -50

        // Gentle nudge back toward the middle on vertical edges
        if (f.y < 25) {
          f.y = 25
          const goingRight = Math.cos(f.angle) >= 0
          f.targetAngle = goingRight ? 0.2 : Math.PI - 0.2 // head slightly down
        }
        if (f.y > height - 25) {
          f.y = height - 25
          const goingRight = Math.cos(f.angle) >= 0
          f.targetAngle = goingRight ? -0.2 : Math.PI + 0.2 // head slightly up
        }

        drawFish(ctx, f)
      }

      // Ambient bubbles drifting up
      for (const b of bubbles) {
        const by = ((b.y - ts * b.speed * 0.025) % (height + 60) + height + 60) % (height + 60)
        const bx = b.x + Math.sin(ts * 0.0007 + b.wobble) * 14
        ctx.beginPath()
        ctx.arc(bx, by, b.r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(170, 160, 235, 0.4)'
        ctx.lineWidth   = 1.5
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(bx - b.r * 0.32, by - b.r * 0.32, b.r * 0.32, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.38)'
        ctx.fill()
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className="aquarium-canvas" />
}
