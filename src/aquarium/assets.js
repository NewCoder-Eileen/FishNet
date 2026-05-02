// ─────────────────────────────────────────────────────────────
//  Central asset config for the aquarium.
//
//  To swap a graphic, set the SPRITES entry to an imported image:
//    import myFish from '../assets/fish.png'
//    SPRITES.fish = myFish
//
//  All drawing functions check SPRITES first and fall back to the
//  built-in canvas drawings when the slot is null.
// ─────────────────────────────────────────────────────────────

// ── Image overrides (set to imported asset path to use your own) ──
export const SPRITES = {
  fish:       null,   // replace: import fishImg from '../assets/fish.png'
  seaweed:    null,   // replace: import seaweedImg from '../assets/seaweed.png'
  bubble:     null,   // replace: import bubbleImg from '../assets/bubble.png'
  coral:      null,   // replace: import coralImg from '../assets/coral.png'
}

// ── World dimensions ──
export const WORLD = {
  width:  3200,
  height: 2200,
}

// ── Player movement ──
export const MOVEMENT = {
  maxSpeed: 5,
  accel:    0.55,
  friction: 0.88,
}

// ── Background gradient (top → bottom) ──
export const BACKGROUND = {
  stops: [
    { pos: 0,    color: '#b8eeff' },
    { pos: 0.3,  color: '#78c8f0' },
    { pos: 0.65, color: '#3898c8' },
    { pos: 1,    color: '#1060a0' },
  ],
  lightRayColor:  '#ffffff',
  lightRayAlpha:  0.05,
  causticColor:   '#a0d8ff',
  causticAlpha:   0.04,
}

// ── Seafloor ──
export const SEAFLOOR = {
  height: 70,
  stops: [
    { pos: 0,   color: 'rgba(120, 100, 65, 0)' },
    { pos: 0.3, color: 'rgba(110, 88, 55, 0.8)' },
    { pos: 1,   color: 'rgba(90, 72, 42, 0.95)' },
  ],
}

// ── Seaweed ──
export const SEAWEED = {
  count:      55,
  hueMin:     130,   // green
  hueMax:     190,   // teal
  satMin:     45,
  satMax:     70,
  lightness:  55,
  thickMin:   3,
  thickMax:   7,
  heightMin:  50,
  heightMax:  135,
  swayAmount: 16,
}

// ── Coral ──
export const CORAL = {
  count:   25,
  sizeMin: 14,
  sizeMax: 46,
  hues:    [345, 22],   // pink/salmon
}

// ── Ambient bubbles ──
export const BUBBLES = {
  count:      65,
  radiusMin:  2,
  radiusMax:  16,
  speedMin:   0.18,
  speedMax:   1.1,
  strokeColor: 'rgba(120, 200, 240, {a})',
  fillColor:   'rgba(180, 230, 255, {a})',
  shineColor:  'rgba(255, 255, 255, {a})',
}

// ── Fish (canvas-drawn style) ──
export const FISH = {
  bodyGradient: [
    { stop: 0,   color: 'rgba(240, 220, 255, 0.98)' },
    { stop: 0.5, color: 'rgba(170, 130, 255, 0.95)' },
    { stop: 1,   color: 'rgba(100, 60, 215, 0.90)'  },
  ],
  tailGradient: [
    { stop: 0, color: 'rgba(80, 40, 200, 0.80)'  },
    { stop: 1, color: 'rgba(170, 130, 255, 0.95)' },
  ],
  finColor:  'rgba(160, 120, 255, 0.65)',
  glowColor: 'rgba(180, 140, 255, 0.60)',
  glowBlur:  18,
  bodyW:     28,
  bodyH:     14,
  tailLen:   15,
}