import { useEffect, useRef } from 'react'
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

export function BowlFish({ styleId, dots = [], onDotEnter, hintRef }) {
  const canvasRef = useRef(null)
  const keysRef   = useRef({})
  const ACCEL = 0.48, FRICTION = 0.91, MAX_V = 4.6

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
      return { W, H }
    }
    let { W, H } = resize()

    const fish = { styleId, x: W / 2, y: H * 0.45, vx: 0, vy: 0, angle: 0, tailPhase: 0, scale: 1.6 }
    const dotState = new Map()
    let raf = 0

    function loop() {
      ctx.clearRect(0, 0, W, H)
      const k = keysRef.current
      if (k['ArrowLeft']  || k['a'] || k['A']) fish.vx -= ACCEL
      if (k['ArrowRight'] || k['d'] || k['D']) fish.vx += ACCEL
      if (k['ArrowUp']    || k['w'] || k['W']) fish.vy -= ACCEL
      if (k['ArrowDown']  || k['s'] || k['S']) fish.vy += ACCEL
      fish.vx *= FRICTION; fish.vy *= FRICTION
      const v = Math.hypot(fish.vx, fish.vy)
      if (v > MAX_V) { fish.vx = (fish.vx / v) * MAX_V; fish.vy = (fish.vy / v) * MAX_V }
      fish.x += fish.vx; fish.y += fish.vy

      const cx = W / 2, cy = H / 2, rx = W * 0.46, ry = H * 0.46
      const ex = (fish.x - cx) / rx, ey = (fish.y - cy) / ry, er = Math.hypot(ex, ey)
      if (er > 1) {
        fish.x = cx + (ex / er) * rx; fish.y = cy + (ey / er) * ry
        const nx = ex / er, ny = ey / er, dotV = fish.vx * nx + fish.vy * ny
        if (dotV > 0) { fish.vx -= dotV * nx; fish.vy -= dotV * ny; fish.vx *= 0.5; fish.vy *= 0.5 }
      }

      if (v > 0.15) fish.angle = Math.atan2(fish.vy, fish.vx)
      fish.tailPhase += 0.08 + v * 0.04
      drawFish(ctx, fish)

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
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [styleId])

  return <canvas ref={canvasRef} className="bowl-fish-canvas" aria-hidden />
}
