// Fish style configs — set `image` to an imported asset path to replace canvas drawing.
export const FISH_STYLES = [
  { id: 'nebula',   label: 'Nebula',   hue: 270 },
  { id: 'lagoon',   label: 'Lagoon',   hue: 170 },
  { id: 'tropical', label: 'Tropical', hue: 25  },
  { id: 'aurora',   label: 'Aurora',   hue: 310 },
  { id: 'sunset',   label: 'Sunset',   hue: 10  },
  { id: 'abyss',    label: 'Abyss',    hue: 220 },
]

export const ACCESSORY_OPTIONS = {
  hat:     [{ id: 'none', label: 'None' }, { id: 'crown', label: 'Crown' }, { id: 'party', label: 'Party Hat' }, { id: 'bow', label: 'Bow' }],
  glasses: [{ id: 'none', label: 'None' }, { id: 'round', label: 'Round' }, { id: 'shades', label: 'Shades' }],
  extra:   [{ id: 'none', label: 'None' }, { id: 'sparkle', label: 'Sparkle' }, { id: 'star', label: 'Star' }],
}

export function getStyle(styleId) {
  return FISH_STYLES.find(s => s.id === styleId) ?? FISH_STYLES[0]
}

// ── Accessory drawing helpers ──

function drawHat(ctx, hat) {
  if (!hat || hat === 'none') return
  if (hat === 'crown') {
    ctx.save()
    ctx.translate(8, -16)
    ctx.fillStyle = '#ffd700'
    ctx.beginPath()
    ctx.moveTo(-10, 8); ctx.lineTo(-10, 0); ctx.lineTo(-5, 4)
    ctx.lineTo(0, -5); ctx.lineTo(5, 4); ctx.lineTo(10, 0); ctx.lineTo(10, 8)
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#c8a000'; ctx.lineWidth = 0.8; ctx.stroke()
    ctx.fillStyle = '#ff4070'
    ctx.beginPath(); ctx.arc(0, -4, 2, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  } else if (hat === 'party') {
    ctx.save()
    ctx.translate(8, -18)
    const pg = ctx.createLinearGradient(0, -16, 0, 0)
    pg.addColorStop(0, '#ff6090'); pg.addColorStop(0.5, '#a060ff'); pg.addColorStop(1, '#60d0ff')
    ctx.fillStyle = pg
    ctx.beginPath()
    ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.lineTo(0, -16); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath(); ctx.arc(-2, -5, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(3, -11, 1.2, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  } else if (hat === 'bow') {
    ctx.save()
    ctx.translate(6, -17)
    ctx.fillStyle = '#ff6090'
    ctx.beginPath(); ctx.ellipse(-6, 0, 7, 4, -0.4, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse(6, 0, 7, 4, 0.4, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#ff3070'
    ctx.beginPath(); ctx.arc(0, 0, 3, 0, Math.PI * 2); ctx.fill()
    ctx.restore()
  }
}

function drawGlasses(ctx, glasses) {
  if (!glasses || glasses === 'none') return
  if (glasses === 'round') {
    ctx.save()
    ctx.translate(14, -3)
    ctx.strokeStyle = 'rgba(80, 60, 140, 0.85)'
    ctx.lineWidth = 1.2
    ctx.beginPath(); ctx.arc(0, 0, 4.5, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(-10, 0, 4.5, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-5.5, 0); ctx.lineTo(-4.5, 0); ctx.stroke()
    ctx.restore()
  } else if (glasses === 'shades') {
    ctx.save()
    ctx.translate(8, -4)
    ctx.fillStyle = 'rgba(20, 10, 50, 0.78)'
    ctx.beginPath(); ctx.roundRect?.(-12, -3.5, 12, 7, 3) ?? ctx.rect(-12, -3.5, 12, 7); ctx.fill()
    ctx.beginPath(); ctx.roundRect?.(1, -3.5, 10, 7, 3) ?? ctx.rect(1, -3.5, 10, 7); ctx.fill()
    ctx.strokeStyle = 'rgba(100, 80, 180, 0.5)'; ctx.lineWidth = 0.8
    ctx.beginPath(); ctx.moveTo(-12, -1); ctx.lineTo(-14, -3); ctx.stroke()
    ctx.restore()
  }
}

function drawExtra(ctx, extra, hue) {
  if (!extra || extra === 'none') return
  if (extra === 'sparkle') {
    ctx.strokeStyle = `hsla(${hue + 40}, 100%, 88%, 0.9)`
    ctx.lineWidth = 1.2
    const positions = [[-22, -22], [24, -14], [-16, 16]]
    positions.forEach(([sx, sy]) => {
      ctx.save()
      ctx.translate(sx, sy)
      for (let i = 0; i < 4; i++) {
        ctx.save(); ctx.rotate((i / 4) * Math.PI * 2)
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -5); ctx.stroke()
        ctx.restore()
      }
      ctx.fillStyle = `hsla(${hue + 40}, 100%, 92%, 1)`
      ctx.beginPath(); ctx.arc(0, 0, 1.8, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
    })
  } else if (extra === 'star') {
    ctx.save()
    ctx.translate(-24, -20)
    ctx.fillStyle = '#ffe060'
    ctx.beginPath()
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? 8 : 4
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r)
      else         ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
    }
    ctx.closePath(); ctx.fill()
    ctx.strokeStyle = '#c8a800'; ctx.lineWidth = 0.5; ctx.stroke()
    ctx.restore()
  }
}

// Shared hue-aware fish draw — used in EventPage and Profile preview.
// fish = { x, y, angle, tailPhase, scale, hue, accessories: { hat, glasses, extra } }
export function drawFish(ctx, fish) {
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
  ctx.translate(-26, 0); ctx.rotate(wag)
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
  ctx.fillStyle = bg; ctx.fill()
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

  // Accessories
  const acc = fish.accessories || {}
  drawHat(ctx, acc.hat)
  drawGlasses(ctx, acc.glasses)
  drawExtra(ctx, acc.extra, hue)

  ctx.restore()
}
