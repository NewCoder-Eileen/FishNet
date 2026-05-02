// Audio asset imports — Vite resolves these to hashed URLs
import bgSrc     from '../assets/leberch-ethereal-511852 (1).mp3'
import clickSrc  from '../assets/ksjsbwuil-click-0-481191.mp3'
import bubbleSrc from '../assets/dragon-studio-popping-bubbles-406647.mp3'
import chimeSrc  from '../assets/soundshelfstudio-ui-success-chime-513565.mp3'

// ── Background music singleton ──────────────────────────────────────────────
// Module-level variables survive React page navigation (SPA never reloads).
let _bg        = null
let _bgPlaying = false
let _muted     = (() => {
  try { return localStorage.getItem('fishnet_muted') === '1' } catch { return false }
})()

function getBg() {
  if (!_bg) {
    _bg = new Audio(bgSrc)
    _bg.loop   = true
    _bg.volume = 0.28
    _bg.muted  = _muted
  }
  return _bg
}

export function startBgMusic() {
  if (_bgPlaying) return
  getBg().play().then(() => { _bgPlaying = true }).catch(() => {})
}

export function toggleMute() {
  _muted = !_muted
  try { localStorage.setItem('fishnet_muted', _muted ? '1' : '0') } catch {}
  getBg().muted = _muted
  return _muted
}

export function getMuted() { return _muted }

// ── One-shot sound effects ──────────────────────────────────────────────────
function shot(src, volume = 0.55) {
  if (_muted) return
  try { const a = new Audio(src); a.volume = volume; a.play().catch(() => {}) } catch {}
}

export const playClick  = () => shot(clickSrc,  0.45)
export const playBubble = () => shot(bubbleSrc, 0.65)
export const playChime  = () => shot(chimeSrc,  0.72)
