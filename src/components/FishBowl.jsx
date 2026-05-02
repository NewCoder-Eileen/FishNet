import { useEffect, useRef } from 'react'
import { FISH_STYLES, drawFish } from '../aquarium/fishStyles'

// A glass fishbowl with all available fish swimming inside. Click a fish to
// select it. The current selection gets a soft golden glow ring beneath it.
//
// Props:
//   selectedStyleId — currently chosen style id
//   onSelect(id)    — fired when the user taps a fish in the bowl
//   width / height  — bowl size in CSS px
export default function FishBowl({
  selectedStyleId,
  onSelect,
  width  = 360,
  height = 320,
}) {
  const canvasRef    = useRef(null)
  const fishesRef    = useRef([])
  const selectedRef  = useRef(selectedStyleId)
  const dimsRef      = useRef({ width, height })

  // Keep the latest selection in a ref so the animation loop reads it
  // without restarting (we don't want clicks to teleport fish).
  useEffect(() => { selectedRef.current = selectedStyleId }, [selectedStyleId])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = width * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    dimsRef.current = { width, height }

    const cx = width / 2
    const cy = height / 2 + 6   // bias slightly down for the round bowl shape
    const rx = width  * 0.42
    const ry = height * 0.40

    function aimFish(f) {
      const ta = Math.random() * Math.PI * 2
      const tr = Math.random() * 0.78
      f.targetX = cx + Math.cos(ta) * tr * rx
      f.targetY = cy + Math.sin(ta) * tr * ry
      f.targetTimer = 90 + Math.random() * 220
    }

    // One fish per style, scattered inside the bowl.
    fishesRef.current = FISH_STYLES.map((style, i) => {
      const a = (i / FISH_STYLES.length) * Math.PI * 2
      const r = 0.35 + Math.random() * 0.35
      const f = {
        styleId:   style.id,
        x:         cx + Math.cos(a) * r * rx,
        y:         cy + Math.sin(a) * r * ry,
        vx: 0, vy: 0,
        angle:     0,
        tailPhase: Math.random() * Math.PI * 2,
        scale:     0.55 + Math.random() * 0.18,
      }
      aimFish(f)
      return f
    })

    let raf = 0
    function loop() {
      ctx.clearRect(0, 0, width, height)

      for (const f of fishesRef.current) {
        // Steering toward target
        const dx = f.targetX - f.x
        const dy = f.targetY - f.y
        const d  = Math.hypot(dx, dy) || 0.0001
        f.vx += (dx / d) * 0.05
        f.vy += (dy / d) * 0.05
        f.vx *= 0.93
        f.vy *= 0.93
        const v = Math.hypot(f.vx, f.vy)
        const maxV = 0.8
        if (v > maxV) {
          f.vx = (f.vx / v) * maxV
          f.vy = (f.vy / v) * maxV
        }
        f.x += f.vx
        f.y += f.vy
        if (v > 0.05) f.angle = Math.atan2(f.vy, f.vx)
        f.tailPhase += 0.08 + v * 0.05
        f.targetTimer -= 1
        if (d < 14 || f.targetTimer <= 0) aimFish(f)

        // Constrain inside the elliptical bowl boundary
        const ex = (f.x - cx) / rx
        const ey = (f.y - cy) / ry
        const er = Math.hypot(ex, ey)
        if (er > 1) {
          f.x = cx + (ex / er) * rx
          f.y = cy + (ey / er) * ry
          aimFish(f)
        }

        // Selection ring under the chosen fish
        if (f.styleId === selectedRef.current) {
          ctx.beginPath()
          ctx.arc(f.x, f.y + 4, 30, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 220, 110, 0.28)'
          ctx.fill()
          ctx.beginPath()
          ctx.arc(f.x, f.y + 4, 30, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(255, 210, 70, 0.8)'
          ctx.lineWidth = 2
          ctx.stroke()
        }

        drawFish(ctx, f)
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [width, height])

  function handleClick(e) {
    if (!onSelect) return
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const { width: w, height: h } = dimsRef.current
    const x = (e.clientX - rect.left) * (w / rect.width)
    const y = (e.clientY - rect.top)  * (h / rect.height)

    let best = null
    let bestDist = Infinity
    for (const f of fishesRef.current) {
      const d = Math.hypot(f.x - x, f.y - y)
      if (d < bestDist && d < 40) {
        bestDist = d
        best = f
      }
    }
    if (best) onSelect(best.styleId)
  }

  return (
    <div className="fishbowl" style={{ width, height }}>
      <canvas
        ref={canvasRef}
        className="fishbowl-canvas"
        style={{ width, height }}
        onClick={handleClick}
      />
      <div className="fishbowl-shine" aria-hidden />
      <div className="fishbowl-water-line" aria-hidden />
    </div>
  )
}
