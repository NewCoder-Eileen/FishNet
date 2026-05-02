// ─────────────────────────────────────────────────────────────
//  All canvas drawing functions for the aquarium.
//  Each function checks SPRITES for an image override before
//  falling back to the built-in canvas drawing.
// ─────────────────────────────────────────────────────────────
import { SPRITES, BACKGROUND, SEAFLOOR, SEAWEED, CORAL, BUBBLES, FISH, WORLD } from './assets'

// ── Replace {a} placeholder in color strings ──
function alpha(template, a) {
  return template.replace('{a}', a.toFixed(2))
}

// ── Seaweed ──
function drawSeaweedCanvas(ctx, sw, time) {
  const segs = Math.max(4, Math.floor(sw.height / 18))
  ctx.lineWidth   = sw.thick
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'
  ctx.strokeStyle = `hsla(${sw.hue}, ${sw.sat}%, ${SEAWEED.lightness}%, 0.82)`
  ctx.beginPath()
  for (let i = 0; i <= segs; i++) {
    const t    = i / segs
    const y    = WORLD.height - SEAFLOOR.height - sw.height * t
    const sway = Math.sin(time * 0.001 * sw.speed + sw.phase + i * 0.65) * SEAWEED.swayAmount * t
    i === 0 ? ctx.moveTo(sw.x + sway, y) : ctx.lineTo(sw.x + sway, y)
  }
  ctx.stroke()

  for (let i = 1; i < segs; i += 2) {
    const t    = i / segs
    const y    = WORLD.height - SEAFLOOR.height - sw.height * t
    const sway = Math.sin(time * 0.001 * sw.speed + sw.phase + i * 0.65) * SEAWEED.swayAmount * t
    const dir  = i % 4 === 1 ? 1 : -1
    ctx.beginPath()
    ctx.ellipse(sw.x + sway + dir * 8, y - 4, 8, 4, dir * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${sw.hue}, ${sw.sat}%, ${SEAWEED.lightness - 7}%, 0.55)`
    ctx.fill()
  }
}

export function drawSeaweed(ctx, sw, time) {
  if (SPRITES.seaweed) {
    const h = sw.height
    ctx.save()
    ctx.translate(sw.x, WORLD.height - SEAFLOOR.height)
    ctx.drawImage(SPRITES.seaweed, -h * 0.3, -h, h * 0.6, h)
    ctx.restore()
    return
  }
  drawSeaweedCanvas(ctx, sw, time)
}

// ── Coral ──
function drawCoralCanvas(ctx, c) {
  const y = WORLD.height - SEAFLOOR.height
  ctx.lineCap = 'round'
  if (c.type === 0) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.8 + (i / 6) * Math.PI * 1.6
      ctx.beginPath(); ctx.moveTo(c.x, y)
      ctx.lineTo(c.x + Math.cos(a) * c.size, y + Math.sin(a) * c.size)
      ctx.lineWidth = 3.5; ctx.strokeStyle = `hsla(${c.hue}, 75%, 62%, 0.85)`; ctx.stroke()
      ctx.beginPath(); ctx.arc(c.x + Math.cos(a) * c.size, y + Math.sin(a) * c.size, 4, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${c.hue}, 80%, 72%, 0.8)`; ctx.fill()
    }
  } else if (c.type === 1) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 5) * Math.PI
      const bx = c.x + Math.cos(a) * c.size * 0.55
      const by = y   - Math.sin(a) * c.size * 0.7
      ctx.beginPath(); ctx.arc(bx, by, c.size * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${c.hue}, 70%, 62%, 0.72)`; ctx.fill()
    }
  } else {
    function branch(bx, by, len, angle, depth) {
      if (depth === 0 || len < 5) return
      const ex = bx + Math.cos(angle) * len, ey = by + Math.sin(angle) * len
      ctx.lineWidth = depth * 1.3; ctx.strokeStyle = `hsla(${c.hue}, 70%, 58%, 0.82)`
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke()
      branch(ex, ey, len * 0.65, angle - 0.45, depth - 1)
      branch(ex, ey, len * 0.65, angle + 0.45, depth - 1)
    }
    branch(c.x, y, c.size, -Math.PI / 2, 4)
  }
}

export function drawCoral(ctx, c) {
  if (SPRITES.coral) {
    ctx.save()
    ctx.translate(c.x, WORLD.height - SEAFLOOR.height)
    ctx.drawImage(SPRITES.coral, -c.size * 0.5, -c.size, c.size, c.size)
    ctx.restore()
    return
  }
  drawCoralCanvas(ctx, c)
}

// ── Bubble ──
export function drawBubble(ctx, b, time) {
  const by = ((b.y - time * b.speed * 0.032) % (WORLD.height + 80) + WORLD.height + 80) % (WORLD.height + 80)
  const bx = b.x + Math.sin(time * 0.0007 + b.wobble) * 20

  if (SPRITES.bubble) {
    ctx.save()
    ctx.globalAlpha = b.opacity
    ctx.drawImage(SPRITES.bubble, bx - b.r, by - b.r, b.r * 2, b.r * 2)
    ctx.restore()
    return
  }

  ctx.beginPath(); ctx.arc(bx, by, b.r, 0, Math.PI * 2)
  ctx.strokeStyle = alpha(BUBBLES.strokeColor, b.opacity)
  ctx.lineWidth = 1.2; ctx.stroke()
  ctx.fillStyle = alpha(BUBBLES.fillColor, b.opacity * 0.15); ctx.fill()
  ctx.beginPath(); ctx.arc(bx - b.r * 0.33, by - b.r * 0.33, b.r * 0.32, 0, Math.PI * 2)
  ctx.fillStyle = alpha(BUBBLES.shineColor, b.opacity * 0.65); ctx.fill()
}

// ── Fish ──
function drawFishCanvas(ctx, x, y, angle, tailPhase) {
  const goingLeft = Math.cos(angle) < 0
  ctx.save()
  ctx.translate(x, y)
  if (goingLeft) { ctx.scale(-1, 1); ctx.rotate(Math.PI - angle) }
  else            { ctx.rotate(angle) }

  const wag = Math.sin(tailPhase) * 0.45

  // Tail
  ctx.save()
  ctx.translate(-26, 0); ctx.rotate(wag)
  ctx.beginPath(); ctx.moveTo(4, 0); ctx.lineTo(-FISH.tailLen, -14); ctx.lineTo(-FISH.tailLen, 14); ctx.closePath()
  const tg = ctx.createLinearGradient(-FISH.tailLen, 0, 4, 0)
  FISH.tailGradient.forEach(({ stop, color }) => tg.addColorStop(stop, color))
  ctx.fillStyle = tg; ctx.fill()
  ctx.restore()

  // Body glow
  ctx.save()
  ctx.shadowColor = FISH.glowColor; ctx.shadowBlur = FISH.glowBlur
  ctx.beginPath(); ctx.ellipse(0, 0, FISH.bodyW, FISH.bodyH, 0, 0, Math.PI * 2)
  const bg = ctx.createRadialGradient(-4, -5, 2, 0, 0, FISH.bodyW + 4)
  FISH.bodyGradient.forEach(({ stop, color }) => bg.addColorStop(stop, color))
  ctx.fillStyle = bg; ctx.fill()
  ctx.restore()
  ctx.strokeStyle = 'rgba(200, 170, 255, 0.35)'; ctx.lineWidth = 1; ctx.stroke()

  // Dorsal fin
  ctx.beginPath(); ctx.moveTo(-8, -14); ctx.quadraticCurveTo(4, -27, 16, -14); ctx.closePath()
  ctx.fillStyle = FISH.finColor; ctx.fill()

  // Pectoral fin
  ctx.beginPath(); ctx.ellipse(2, 9, 12, 5, 0.5, 0, Math.PI * 2)
  ctx.fillStyle = FISH.finColor.replace('0.65', '0.4'); ctx.fill()

  // Eye
  ctx.beginPath(); ctx.arc(16, -3, 5, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()
  ctx.beginPath(); ctx.arc(17, -3, 2.8, 0, Math.PI * 2); ctx.fillStyle = '#100828'; ctx.fill()
  ctx.beginPath(); ctx.arc(18.2, -4.5, 1.2, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill()

  ctx.restore()
}

export function drawFish(ctx, x, y, angle, tailPhase) {
  if (SPRITES.fish) {
    const goingLeft = Math.cos(angle) < 0
    ctx.save()
    ctx.translate(x, y)
    if (goingLeft) { ctx.scale(-1, 1); ctx.rotate(Math.PI - angle) }
    else            { ctx.rotate(angle) }
    ctx.drawImage(SPRITES.fish, -FISH.bodyW - FISH.tailLen, -FISH.bodyH, (FISH.bodyW + FISH.tailLen) * 2, FISH.bodyH * 2)
    ctx.restore()
    return
  }
  drawFishCanvas(ctx, x, y, angle, tailPhase)
}

// ── Full world background ──
export function drawBackground(ctx, W, H, time) {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  BACKGROUND.stops.forEach(({ pos, color }) => bg.addColorStop(pos, color))
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)

  // Light rays
  ctx.save(); ctx.globalAlpha = BACKGROUND.lightRayAlpha
  for (let i = 0; i < 12; i++) {
    const rx = (W / 12) * i + Math.sin(time * 0.00022 + i) * 55
    ctx.beginPath(); ctx.moveTo(rx, 0); ctx.lineTo(rx - 120, H); ctx.lineTo(rx + 120, H); ctx.closePath()
    ctx.fillStyle = BACKGROUND.lightRayColor; ctx.fill()
  }
  ctx.restore()

  // Caustics
  ctx.save(); ctx.globalAlpha = BACKGROUND.causticAlpha
  for (let i = 0; i < 16; i++) {
    const cx = (Math.sin(time * 0.0005 + i * 1.7) * 0.5 + 0.5) * W
    const cy = (Math.sin(time * 0.0004 + i * 2.3) * 0.5 + 0.5) * H * 0.4
    const r  = 40 + Math.sin(time * 0.001 + i) * 20
    const g  = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, BACKGROUND.causticColor); g.addColorStop(1, 'transparent')
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()

  // Seafloor
  const sand = ctx.createLinearGradient(0, H - SEAFLOOR.height, 0, H)
  SEAFLOOR.stops.forEach(({ pos, color }) => sand.addColorStop(pos, color))
  ctx.fillStyle = sand; ctx.fillRect(0, H - SEAFLOOR.height, W, SEAFLOOR.height)
}

// ── World border ──
export function drawBorder(ctx, W, H) {
  ctx.save()
  ctx.shadowColor = 'rgba(60, 160, 255, 0.5)'; ctx.shadowBlur = 24
  ctx.strokeStyle = 'rgba(60, 160, 255, 0.3)'; ctx.lineWidth = 8
  ctx.strokeRect(4, 4, W - 8, H - 8)
  ctx.restore()
}

// ── Pre-generate static decoration data ──
export function generateDecorations() {
  const { width: W, height: H } = WORLD

  const seaweed = Array.from({ length: SEAWEED.count }, () => ({
    x:      40 + Math.random() * (W - 80),
    height: SEAWEED.heightMin + Math.random() * (SEAWEED.heightMax - SEAWEED.heightMin),
    phase:  Math.random() * Math.PI * 2,
    speed:  0.6 + Math.random() * 0.8,
    hue:    SEAWEED.hueMin + Math.random() * (SEAWEED.hueMax - SEAWEED.hueMin),
    sat:    SEAWEED.satMin + Math.random() * (SEAWEED.satMax - SEAWEED.satMin),
    thick:  SEAWEED.thickMin + Math.random() * (SEAWEED.thickMax - SEAWEED.thickMin),
  }))

  const coral = Array.from({ length: CORAL.count }, () => ({
    x:    40 + Math.random() * (W - 80),
    size: CORAL.sizeMin + Math.random() * (CORAL.sizeMax - CORAL.sizeMin),
    hue:  CORAL.hues[Math.random() > 0.5 ? 0 : 1],
    type: Math.floor(Math.random() * 3),
  }))

  const bubbles = Array.from({ length: BUBBLES.count }, () => ({
    x:       Math.random() * W,
    y:       Math.random() * H,
    r:       BUBBLES.radiusMin + Math.random() * (BUBBLES.radiusMax - BUBBLES.radiusMin),
    speed:   BUBBLES.speedMin  + Math.random() * (BUBBLES.speedMax  - BUBBLES.speedMin),
    wobble:  Math.random() * Math.PI * 2,
    opacity: 0.25 + Math.random() * 0.45,
  }))

  return { seaweed, coral, bubbles }
}