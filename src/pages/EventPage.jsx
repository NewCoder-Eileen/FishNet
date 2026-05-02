import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { WORLD, MOVEMENT } from '../aquarium/assets'
import { generateDecorations, drawBackground, drawBorder, drawSeaweed, drawCoral, drawBubble } from '../aquarium/draw'
import { ref, set, onValue, remove, onDisconnect } from 'firebase/database'
import { loadProfile } from '../lib/profile'
import { getSession } from '../lib/auth'
import { db } from '../lib/firebase'
import { drawFish, getStyle } from '../aquarium/fishStyles'

const { width: WORLD_W, height: WORLD_H } = WORLD
const { maxSpeed: MAX_SPEED, accel: ACCEL, friction: FRICTION } = MOVEMENT

// Proximity bubble trigger distance (px in world space)
const PROXIMITY_R = 110

const DECO = generateDecorations()

function drawNameplate(ctx, fish) {
  if (!fish.name) return
  ctx.save()
  ctx.font = '600 13px system-ui, sans-serif'
  ctx.textAlign = 'center'
  const w  = ctx.measureText(fish.name).width + 16
  const px = fish.x
  const py = fish.y - 36
  ctx.fillStyle = `hsla(${fish.hue || 270}, 60%, 96%, 0.78)`
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(px - w / 2, py - 13, w, 18, 9); ctx.fill()
  } else {
    ctx.fillRect(px - w / 2, py - 13, w, 18)
  }
  ctx.fillStyle = `hsla(${fish.hue || 270}, 50%, 28%, 0.95)`
  ctx.fillText(fish.name, px, py)
  ctx.restore()
}

// Proximity bubble — shows shared interests/goals when two fish are close.
// Activates when `others` is populated by a real-time backend.
function drawProximityBubble(ctx, player, other, proximity) {
  const alpha = Math.min(1, proximity * 1.8)
  const mx = (player.x + other.x) / 2
  const my = (player.y + other.y) / 2 - 70

  const sharedInterests = (player.interests || []).filter(i => (other.interests || []).includes(i))
  const sharedGoals     = (player.goals     || []).filter(g => (other.goals     || []).includes(g))

  const lines = []
  if (sharedInterests.length) lines.push(`✦ ${sharedInterests.slice(0, 2).join(' · ')}`)
  if (sharedGoals.length)     lines.push(`→ ${sharedGoals.slice(0, 2).join(' · ')}`)
  if (!lines.length)          lines.push('👋 Say hi!')

  const BW = 158
  const BH = 14 + lines.length * 18 + 14

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle   = 'rgba(255, 255, 255, 0.9)'
  ctx.shadowColor = 'rgba(140, 100, 255, 0.4)'
  ctx.shadowBlur  = 14
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(mx - BW / 2, my - BH / 2, BW, BH, 12); ctx.fill()
  } else {
    ctx.fillRect(mx - BW / 2, my - BH / 2, BW, BH)
  }
  ctx.shadowBlur  = 0
  ctx.strokeStyle = 'rgba(160, 120, 255, 0.35)'
  ctx.lineWidth   = 1
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(mx - BW / 2, my - BH / 2, BW, BH, 12); ctx.stroke()
  }
  ctx.fillStyle = '#3a2878'
  ctx.font      = '600 11px system-ui, sans-serif'
  ctx.textAlign = 'center'
  lines.forEach((line, i) => ctx.fillText(line, mx, my - BH / 2 + 22 + i * 18))
  ctx.restore()
}

export default function EventPage() {
  const { code }  = useParams()
  const navigate  = useNavigate()
  const location  = useLocation()
  const canvasRef = useRef(null)
  const eventName = location.state?.name || code

  const [showWelcome, setShowWelcome] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 3500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      console.error('Canvas ref not available')
      return
    }
    const ctx    = canvas.getContext('2d')
    if (!ctx) {
      console.error('Could not get canvas context')
      return
    }

    try {
      const me          = loadProfile()
      const style       = getStyle(me.fish?.styleId)
      const myHue       = style.hue
      const myAccessories = {
        hat:     me.fish?.hat     || 'none',
        glasses: me.fish?.glasses || 'none',
        extra:   me.fish?.extra   || 'none',
      }

      const myId = getSession()?.username || `fish-${Math.random().toString(36).slice(2, 7)}`
      console.log('EventPage initialized with myId:', myId, 'code:', code)

      const state = {
        player: {
          x: WORLD_W / 2, y: WORLD_H / 2,
          vx: 0, vy: 0, angle: 0, tailPhase: 0,
          hue: myHue, scale: 1.15,
          accessories: myAccessories,
          name:      me.name      || 'You',
          interests: me.interests || [],
          goals:     me.goals     || [],
        },
        others: [],
        cam:  { x: WORLD_W / 2 - window.innerWidth / 2, y: WORLD_H / 2 - window.innerHeight / 2 },
        keys: {},
      }

      // ── Firebase real-time presence ──
      const playerRef = ref(db, `events/${code}/${myId}`)
      onDisconnect(playerRef).remove()

      const broadcastId = setInterval(() => {
        set(playerRef, {
          name:        state.player.name,
          hue:         state.player.hue,
          accessories: state.player.accessories,
          x:           Math.round(state.player.x),
          y:           Math.round(state.player.y),
          angle:       state.player.angle,
          scale:       state.player.scale,
          interests:   state.player.interests,
          goals:       state.player.goals,
        }).catch(err => console.error('Firebase write error:', err))
      }, 100)

      const eventRef = ref(db, `events/${code}`)
      const unsub = onValue(eventRef, snapshot => {
        const data = snapshot.val() || {}
        for (const [id, val] of Object.entries(data)) {
          if (id === myId) continue
          const idx = state.others.findIndex(o => o.id === id)
          if (idx >= 0) {
            Object.assign(state.others[idx], val)
          } else {
            state.others.push({ ...val, id, tailPhase: Math.random() * Math.PI * 2, seed: Math.random() * 1000 })
          }
        }
        for (let i = state.others.length - 1; i >= 0; i--) {
          if (!data[state.others[i].id]) state.others.splice(i, 1)
        }
      }, err => console.error('Firebase read error:', err))

      function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
      resize()
      window.addEventListener('resize', resize)

      function onKeyDown(e) {
        state.keys[e.key] = true
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      }
      function onKeyUp(e) { state.keys[e.key] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup',   onKeyUp)

      let animId

      function loop(ts) {
        const { player, others, cam, keys } = state
        const W = canvas.width, H = canvas.height

        // ── Player input ──
        const left  = keys['ArrowLeft']  || keys['a'] || keys['A']
        const right = keys['ArrowRight'] || keys['d'] || keys['D']
        const up    = keys['ArrowUp']    || keys['w'] || keys['W']
        const down  = keys['ArrowDown']  || keys['s'] || keys['S']

        if (left)  player.vx -= ACCEL
        if (right) player.vx += ACCEL
        if (up)    player.vy -= ACCEL
        if (down)  player.vy += ACCEL

        player.vx *= FRICTION
        player.vy *= FRICTION

        const pSpd = Math.hypot(player.vx, player.vy)
        if (pSpd > MAX_SPEED) {
          player.vx = (player.vx / pSpd) * MAX_SPEED
          player.vy = (player.vy / pSpd) * MAX_SPEED
        }

        player.x = Math.max(35, Math.min(WORLD_W - 35, player.x + player.vx))
        player.y = Math.max(35, Math.min(WORLD_H - 35, player.y + player.vy))

        if (pSpd > 0.15) player.angle = Math.atan2(player.vy, player.vx)
        player.tailPhase += 0.07 + pSpd * 0.05

        // Advance tail animation for other fish between network updates
        for (const o of state.others) o.tailPhase += 0.05

        // ── Camera follow ──
        cam.x += ((player.x - W / 2) - cam.x) * 0.09
        cam.y += ((player.y - H / 2) - cam.y) * 0.09
        cam.x = Math.max(0, Math.min(WORLD_W - W, cam.x))
        cam.y = Math.max(0, Math.min(WORLD_H - H, cam.y))

        // ── Render ──
        ctx.clearRect(0, 0, W, H)
        ctx.save()
        ctx.translate(-(cam.x | 0), -(cam.y | 0))

        drawBackground(ctx, WORLD_W, WORLD_H, ts)
        for (const c  of DECO.coral)   { ctx.save(); drawCoral(ctx, c);        ctx.restore() }
        for (const sw of DECO.seaweed) { ctx.save(); drawSeaweed(ctx, sw, ts); ctx.restore() }
        for (const b  of DECO.bubbles) { drawBubble(ctx, b, ts) }
        drawBorder(ctx, WORLD_W, WORLD_H)

        // Proximity bubbles between player and nearby users
        for (const o of others) {
          const dist = Math.hypot(player.x - o.x, player.y - o.y)
          if (dist < PROXIMITY_R) {
            drawProximityBubble(ctx, player, o, 1 - dist / PROXIMITY_R)
          }
        }

        // Other users' fish + nameplates
        for (const o of others) {
          drawFish(ctx, o)
          drawNameplate(ctx, o)
        }

        // Player fish on top
        drawFish(ctx, player)
        drawNameplate(ctx, player)

        ctx.restore()
        animId = requestAnimationFrame(loop)
      }

      animId = requestAnimationFrame(loop)
      return () => {
        cancelAnimationFrame(animId)
        clearInterval(broadcastId)
        unsub()
        remove(playerRef)
        window.removeEventListener('resize',  resize)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup',   onKeyUp)
      }
    } catch (err) {
      console.error('EventPage error:', err)
      return () => {}
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas 
        ref={canvasRef} 
        width={window.innerWidth} 
        height={window.innerHeight}
        style={{ display: 'block', position: 'absolute', top: 0, left: 0 }} 
      />
      <Navbar dark />

      {showWelcome && (
        <div className="welcome-toast">
          🐟 Welcome to <strong>{eventName}</strong>!
        </div>
      )}

      <div className="event-hud-code">
        <span className="hud-event-name">{eventName}</span>
        &nbsp;·&nbsp; {code} &nbsp;·&nbsp; WASD / ↑↓←→ to swim
      </div>

      <button className="event-leave-btn" onClick={() => navigate('/')}>
        ← Leave
      </button>
    </div>
  )
}
