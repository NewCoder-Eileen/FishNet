import { useEffect, useRef } from 'react'
import { FISH_STYLES, drawFish } from '../../aquarium/fishStyles'

// Animated FishNet aquatic background — gradient + light rays + ambient
// bubbles + autonomous fish swimming around. Sits behind the hero content.
export default function FishnetBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let raf = 0

    function resize() {
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      canvas.width  = w * dpr
      canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    // Pick a fish heading toward a soft target inside the visible area.
    function aimToward(f, W, H) {
      const tx = W * 0.15 + Math.random() * W * 0.7
      const ty = H * 0.20 + Math.random() * H * 0.6
      const a  = Math.atan2(ty - f.y, tx - f.x) + (Math.random() - 0.5) * 0.5
      const s  = 0.45 + Math.random() * 0.65
      f.vx = Math.cos(a) * s
      f.vy = Math.sin(a) * s
      f.angle = a
      f.nextTurn = 240 + Math.random() * 500
    }

    const fishes = Array.from({ length: 9 }, () => {
      const style = FISH_STYLES[Math.floor(Math.random() * FISH_STYLES.length)]
      const f = {
        x: Math.random() * canvas.clientWidth,
        y: Math.random() * canvas.clientHeight,
        vx: 0, vy: 0, angle: 0,
        tailPhase: Math.random() * Math.PI * 2,
        scale:     0.65 + Math.random() * 0.55,
        styleId:   style.id,
        nextTurn:  0,
      }
      aimToward(f, canvas.clientWidth, canvas.clientHeight)
      return f
    })

    const bubbles = Array.from({ length: 30 }, () => ({
      x:       Math.random() * canvas.clientWidth,
      y:       Math.random() * canvas.clientHeight,
      r:       2.5 + Math.random() * 7,
      speed:   0.25 + Math.random() * 0.6,
      wobble:  Math.random() * Math.PI * 2,
      opacity: 0.18 + Math.random() * 0.45,
    }))

    function loop(ts) {
      const W = canvas.clientWidth
      const H = canvas.clientHeight

      // Aquatic vertical gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0,    '#b8eeff')
      bg.addColorStop(0.35, '#78c8f0')
      bg.addColorStop(0.7,  '#3898c8')
      bg.addColorStop(1,    '#1f5f95')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Drifting light rays
      ctx.save()
      ctx.globalAlpha = 0.08
      ctx.fillStyle = '#ffffff'
      for (let i = 0; i < 7; i++) {
        const rx = (W / 7) * i + Math.sin(ts * 0.00025 + i * 0.7) * 90
        ctx.beginPath()
        ctx.moveTo(rx, 0)
        ctx.lineTo(rx - 110, H)
        ctx.lineTo(rx + 110, H)
        ctx.closePath()
        ctx.fill()
      }
      ctx.restore()

      // Caustics
      ctx.save()
      ctx.globalAlpha = 0.05
      for (let i = 0; i < 14; i++) {
        const cx = (Math.sin(ts * 0.0005 + i * 1.7) * 0.5 + 0.5) * W
        const cy = (Math.sin(ts * 0.0004 + i * 2.3) * 0.5 + 0.5) * H * 0.45
        const r  = 30 + Math.sin(ts * 0.001 + i) * 18
        const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
        g.addColorStop(0, '#a0d8ff'); g.addColorStop(1, 'transparent')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()

      // Fish — autonomous wandering
      for (const f of fishes) {
        f.x += f.vx
        f.y += f.vy
        f.tailPhase += 0.07 + Math.hypot(f.vx, f.vy) * 0.05
        f.nextTurn  -= 1
        if (f.nextTurn <= 0 || f.x < -60 || f.x > W + 60 || f.y < -60 || f.y > H + 60) {
          aimToward(f, W, H)
        }
        f.angle = Math.atan2(f.vy, f.vx)
        drawFish(ctx, f)
      }

      // Ambient bubbles
      for (const b of bubbles) {
        b.y -= b.speed
        b.x += Math.sin(ts * 0.001 + b.wobble) * 0.35
        if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W }
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(220, 240, 255, ${(b.opacity * 0.35).toFixed(2)})`
        ctx.fill()
        ctx.strokeStyle = `rgba(180, 220, 255, ${b.opacity.toFixed(2)})`
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(b.x - b.r * 0.32, b.y - b.r * 0.32, b.r * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${(b.opacity * 0.7).toFixed(2)})`
        ctx.fill()
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      aria-hidden
    />
  )
}
