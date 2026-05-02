import clownfishUrl from '../assets/fish-clownfish.png'
import goldfishUrl  from '../assets/fish-goldfish.png'
import blushUrl     from '../assets/fish-blush.png'
import bluefinUrl   from '../assets/fish-bluefin.png'
import mossUrl      from '../assets/fish-moss.png'
import koipinkUrl   from '../assets/fish-koipink.png'
import koiblueUrl   from '../assets/fish-koiblue.png'
import sardineUrl   from '../assets/fish-sardine.png'

// ── Fish styles ───────────────────────────────────────────────
// Each entry has:
//   image:          imported asset URL
//   naturalFacing:  'left' | 'right'  — which way the source art faces
//   size:           target render size in fish-local px (longer dimension);
//                   the other dimension is derived from the image's natural
//                   aspect ratio so nothing gets stretched.
//   hue:            kept for accent purposes (e.g. nameplate tint)
// Order matters — index 0 is the default style.
export const FISH_STYLES = [
  { id: 'clownfish', label: 'Clownfish', image: clownfishUrl, naturalFacing: 'left',  size: 64, hue: 18  },
  { id: 'goldfish',  label: 'Goldfish',  image: goldfishUrl,  naturalFacing: 'right', size: 68, hue: 36  },
  { id: 'blush',     label: 'Blush',     image: blushUrl,     naturalFacing: 'right', size: 68, hue: 330 },
  { id: 'bluefin',   label: 'Bluefin',   image: bluefinUrl,   naturalFacing: 'right', size: 68, hue: 210 },
  { id: 'moss',      label: 'Moss',      image: mossUrl,      naturalFacing: 'right', size: 68, hue: 130 },
  { id: 'koipink',   label: 'Koi Pink',  image: koipinkUrl,   naturalFacing: 'left',  size: 70, hue: 335 },
  { id: 'koiblue',   label: 'Koi Blue',  image: koiblueUrl,   naturalFacing: 'left',  size: 70, hue: 200 },
  { id: 'sardine',   label: 'Sardine',   image: sardineUrl,   naturalFacing: 'right', size: 76, hue: 220 },
]

// Preload sprites so the first render doesn't flash blank.
const FISH_IMAGES = Object.fromEntries(
  FISH_STYLES.map(s => {
    const img = new Image()
    img.src = s.image
    return [s.id, img]
  })
)

export function getStyle(styleId) {
  return FISH_STYLES.find(s => s.id === styleId) ?? FISH_STYLES[0]
}

// fish = { x, y, angle, tailPhase, scale, styleId }
export function drawFish(ctx, fish) {
  const { x, y, angle, tailPhase, scale = 1, styleId } = fish
  const style = getStyle(styleId)
  const img   = FISH_IMAGES[style.id]

  const goingLeft = Math.cos(angle) < 0
  ctx.save()
  ctx.translate(x, y)
  // Engine convention: a fish at angle=0 swims to the right.
  if (goingLeft) { ctx.scale(-1, 1); ctx.rotate(Math.PI - angle) }
  else            { ctx.rotate(angle) }
  ctx.scale(scale, scale)

  const wobble  = Math.sin(tailPhase) * 0.05
  const breathe = 1 + Math.sin(tailPhase * 2) * 0.02
  ctx.rotate(wobble)

  if (img && img.complete && img.naturalWidth > 0) {
    // Preserve the source aspect ratio so nothing is squished. We fit the
    // longer source dimension to `style.size` and derive the other axis.
    const aspect = img.naturalWidth / img.naturalHeight
    const drawW  = aspect >= 1 ? style.size : style.size * aspect
    const drawH  = aspect >= 1 ? style.size / aspect : style.size
    // Source art that naturally faces left needs a one-time horizontal flip
    // to match the engine's "default-faces-right" convention. The outer flip
    // block above then handles direction-of-travel correctly.
    const sx = (style.naturalFacing === 'left' ? -1 : 1) * breathe
    ctx.scale(sx, breathe)
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
  } else {
    ctx.beginPath()
    ctx.ellipse(0, 0, style.size / 2, style.size / 2, 0, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(${style.hue}, 60%, 78%, 0.9)`
    ctx.fill()
  }

  ctx.restore()
}
