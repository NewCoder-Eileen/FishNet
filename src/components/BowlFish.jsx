import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { getStyle, drawFish } from '../aquarium/fishStyles'

export function FishPreview({ styleId, width = 84, height = 84 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = width  * dpr
    canvas.height = height * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const style = getStyle(styleId)
    const fish = { styleId: style.id, x: width / 2, y: height / 2, angle: 0, tailPhase: 0, scale: Math.min(width, height) / 75 }
    let raf = 0
    function loop(ts) { ctx.clearRect(0, 0, width, height); fish.tailPhase = ts * 0.005; drawFish(ctx, fish); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [styleId, width, height])
  return <canvas ref={ref} style={{ width, height, display: 'block' }} aria-hidden />
}

export const BowlFish = forwardRef(function BowlFish({ styleId, dots = [], onDotEnter, hintRef }, ref) {
  const canvasRef = useRef(null)
  const keysRef   = useRef({})
  const foodRef   = useRef([])
  const sparksRef = useRef([])
  const sizeRef   = useRef({ W: 0, H: 0 })

  const ACCEL = 0.48, FRICTION = 0.91, MAX_V = 4.6
  const SEEK  = 0.18
  const EAT_R = 14
  const MAX_FOOD = 18

  useImperativeHandle(ref, () => ({
    feed: () => {
      const { W, H } = sizeRef.current
      if (!W || !H) return
      const cx = W / 2
      const count = 4 + Math.floor(Math.random() * 3)
      for (let i = 0; i < count; i++) {
        foodRef.current.push({
          x:  cx + (Math.random() - 0.5) * W * 0.32,
          y:  H * 0.08 + Math.random() * 12,
          vx: (Math.random() - 0.5) * 0.45,
          vy: 0.25 + Math.random() * 0.25,
          r:  3 + Math.random() * 1.6,
          life: 0,
          settled: false,
        })
      }
      if (foodRef.current.length > MAX_FOOD) {
        foodRef.current = foodRef.current.slice(-MAX_FOOD)
      }
    }
  }), [])

  useEffect(() => {
    function onKeyDown(e) {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      keysRef.current[e.key] = true
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault()
    }
    function onKeyUp(e) { keysRef.current[e.key] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => { window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp) }
  }, [])

  const propsRef = useRef({ dots, onDotEnter, hintRef })
  useEffect(() => { propsRef.current = { dots, onDotEnter, hintRef } }, [dots, onDotEnter, hintRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const W = canvas.clientWidth, H = canvas.clientHeight
      canvas.width = W * dpr; canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      sizeRef.current = { W, H }
      return { W, H }
    }
    let { W, H } = resize()

    const fish = { styleId, x: W / 2, y: H * 0.45, vx: 0, vy: 0, angle: 0, tailPhase: 0, scale: 1.6 }
    const dotState = new Map()
    const mouseTarget = { current: null }
    let raf = 0

    function onBowlClick(e) {
      const rect = canvas.getBoundingClientRect()
      mouseTarget.current = {
        x: (e.clientX - rect.left) * (W / rect.width),
        y: (e.clientY - rect.top)  * (H / rect.height),
      }
    }
    canvas.addEventListener('click', onBowlClick)

    function loop() {
      ctx.clearRect(0, 0, W, H)

      const cx = W / 2, cy = H / 2, rx = W * 0.46, ry = H * 0.46
      const sandTop = H * 0.79

      // ── Food physics ──
      const food = foodRef.current
      for (let i = food.length - 1; i >= 0; i--) {
        const p = food[i]
        if (p.settled) {
          p.life += 1
          if (p.life > 360) { food.splice(i, 1); continue }
        } else {
          p.vy += 0.014
          p.vy *= 0.985
          p.vx *= 0.97
          p.x  += p.vx
          p.y  += p.vy
          if (p.y >= sandTop) { p.y = sandTop; p.vy = 0; p.vx *= 0.5; p.settled = true }
          const ex = (p.x - cx) / rx, ey = (p.y - cy) / ry, er = Math.hypot(ex, ey)
          if (er > 1) { p.x = cx + (ex / er) * rx; p.y = cy + (ey / er) * ry; p.vx *= -0.3 }
        }
      }

      // ── Player input ──
      const k = keysRef.current
      const kLeft  = k['ArrowLeft']  || k['a'] || k['A']
      const kRight = k['ArrowRight'] || k['d'] || k['D']
      const kUp    = k['ArrowUp']    || k['w'] || k['W']
      const kDown  = k['ArrowDown']  || k['s'] || k['S']
      if (kLeft)  fish.vx -= ACCEL
      if (kRight) fish.vx += ACCEL
      if (kUp)    fish.vy -= ACCEL
      if (kDown)  fish.vy += ACCEL
      if (kLeft || kRight || kUp || kDown) mouseTarget.current = null

      // ── Mouse / tap target ──
      const mt = mouseTarget.current
      if (mt && !kLeft && !kRight && !kUp && !kDown) {
        const dx = mt.x - fish.x, dy = mt.y - fish.y
        const dist = Math.hypot(dx, dy)
        if (dist < 15) { mouseTarget.current = null }
        else { fish.vx += (dx / dist) * ACCEL; fish.vy += (dy / dist) * ACCEL }
      }

      // ── Seek nearest pellet & eat on contact ──
      let nearest = null, nearestDist = Infinity, nearestIdx = -1
      for (let i = 0; i < food.length; i++) {
        const p = food[i]
        const d = Math.hypot(p.x - fish.x, p.y - fish.y)
        if (d < nearestDist) { nearestDist = d; nearest = p; nearestIdx = i }
      }
      if (nearest) {
        const dx = nearest.x - fish.x, dy = nearest.y - fish.y
        const d  = Math.hypot(dx, dy) || 0.001
        fish.vx += (dx / d) * SEEK
        fish.vy += (dy / d) * SEEK
        if (d < EAT_R) {
          for (let s = 0; s < 4; s++) {
            sparksRef.current.push({
              x: nearest.x, y: nearest.y,
              vx: (Math.random() - 0.5) * 1.4,
              vy: -Math.random() * 1.0,
              life: 1.0,
            })
          }
          food.splice(nearestIdx, 1)
        }
      }

      fish.vx *= FRICTION; fish.vy *= FRICTION
      const v = Math.hypot(fish.vx, fish.vy)
      if (v > MAX_V) { fish.vx = (fish.vx / v) * MAX_V; fish.vy = (fish.vy / v) * MAX_V }
      fish.x += fish.vx; fish.y += fish.vy

      const ex = (fish.x - cx) / rx, ey = (fish.y - cy) / ry, er = Math.hypot(ex, ey)
      if (er > 1) {
        fish.x = cx + (ex / er) * rx; fish.y = cy + (ey / er) * ry
        const nx = ex / er, ny = ey / er, dotV = fish.vx * nx + fish.vy * ny
        if (dotV > 0) { fish.vx -= dotV * nx; fish.vy -= dotV * ny; fish.vx *= 0.5; fish.vy *= 0.5 }
      }

      if (v > 0.15) fish.angle = Math.atan2(fish.vy, fish.vx)
      fish.tailPhase += 0.08 + v * 0.04

      // ── Draw food pellets ──
      for (const p of food) {
        const wobble = p.settled ? 0 : Math.sin((p.x + p.y) * 0.04) * 0.6
        ctx.save()
        ctx.fillStyle = '#5a3318'
        ctx.beginPath(); ctx.arc(p.x + wobble, p.y, p.r, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#a0683a'
        ctx.beginPath(); ctx.arc(p.x + wobble - p.r * 0.3, p.y - p.r * 0.35, p.r * 0.42, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      drawFish(ctx, fish)

      // ── Sparkle particles ──
      const sparks = sparksRef.current
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx; s.y += s.vy; s.vy += 0.05; s.life -= 0.05
        if (s.life <= 0) { sparks.splice(i, 1); continue }
        ctx.save()
        ctx.globalAlpha = Math.max(s.life, 0)
        ctx.fillStyle = 'rgba(255, 250, 220, 0.95)'
        ctx.beginPath(); ctx.arc(s.x, s.y, 1.6, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      const pp = propsRef.current
      for (const d of pp.dots) {
        const dist = Math.hypot(d.xPct * W - fish.x, d.yPct * H - fish.y)
        const inside = dist < (d.hitR ?? 36)
        if (inside && !dotState.get(d.id)?.inside) pp.onDotEnter?.(d.id)
        dotState.set(d.id, { inside })
      }
      const hintEl = pp.hintRef?.current
      if (hintEl) { hintEl.style.left = `${fish.x}px`; hintEl.style.top = `${fish.y - 44}px` }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    function onResize() { ({ W, H } = resize()) }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); canvas.removeEventListener('click', onBowlClick); window.removeEventListener('resize', onResize) }
  }, [styleId])

  return <canvas ref={canvasRef} className="bowl-fish-canvas" style={{ cursor: 'pointer' }} aria-hidden />
})
