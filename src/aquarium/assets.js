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
// Layered seaweed system: each plant is assigned to a depth layer with its own
// scale, opacity, blur, sway range, and fish-reactivity. Tune values here —
// drawing logic in draw.js reads everything from this config.
export const SEAWEED = {
  count: 75,

  // Depth layers. `weight` controls how many plants land in each layer.
  // bg = soft/distant, mid = main body, fg = sharp/in front of fish.
  layers: {
    bg:  { weight: 0.40, scale: 0.78, alpha: 0.42, sway: 11, speedMul: 0.65, blur: 3, reactRadius:   0, reactStrength:  0 },
    mid: { weight: 0.40, scale: 1.00, alpha: 0.85, sway: 17, speedMul: 1.00, blur: 0, reactRadius: 100, reactStrength: 14 },
    fg:  { weight: 0.20, scale: 1.18, alpha: 1.00, sway: 23, speedMul: 1.25, blur: 0, reactRadius: 135, reactStrength: 22 },
  },

  // Color range — kept desaturated so plants read as ambient, not loud.
  hueMin:     135,   // green
  hueMax:     185,   // teal
  satMin:     32,
  satMax:     58,
  lightMin:   38,
  lightMax:   56,

  // Geometry
  thickMin:   3,
  thickMax:   7,
  heightMin:  60,
  heightMax:  170,
  segments:   14,    // curve resolution

  // Fish interaction
  agitationDecay: 0.94,  // per-frame decay of "I was just disturbed" state
  bendEase:       0.85,  // per-frame ease-back of horizontal bend
  agitationBoost: 1.6,   // sway multiplier at full agitation

  // Frond/leaf accents
  frondAlpha: 0.55,

  // Drift particles emitted around agitated plants
  particles: {
    maxPerPlant: 5,
    emitChance:  0.18,    // per frame, when agitation > emitThreshold
    emitThreshold: 0.35,
    rise:        0.55,    // px/frame
    color:       'rgba(210, 240, 235, {a})',
  },
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