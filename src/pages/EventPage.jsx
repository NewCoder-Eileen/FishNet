import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { WORLD, MOVEMENT } from '../aquarium/assets'
import { generateDecorations, drawBackground, drawBorder, drawSeaweedLayer, updateSeaweed, drawCoral, drawBubble } from '../aquarium/draw'
import { ref, set, onValue, remove, onDisconnect } from 'firebase/database'
import { loadProfile } from '../lib/profile'
import { getSession } from '../lib/auth'
import { db } from '../lib/firebase'
import { drawFish, getStyle } from '../aquarium/fishStyles'

const { width: WORLD_W, height: WORLD_H } = WORLD
const { maxSpeed: MAX_SPEED, accel: ACCEL, friction: FRICTION } = MOVEMENT

const PROXIMITY_R = 110

const DECO = generateDecorations()

function drawNameplate(ctx, fish) {
  if (!fish.name) return
  const isYou = fish.name === 'You'
  ctx.save()
  ctx.font = `${isYou ? '700' : '600'} 13px system-ui, sans-serif`
  ctx.textAlign = 'center'
  const w  = ctx.measureText(fish.name).width + 18
  const px = fish.x
  const py = fish.y - 38
  ctx.fillStyle   = isYou ? 'rgba(160, 100, 255, 0.88)' : `hsla(${fish.hue || 270}, 55%, 94%, 0.82)`
  ctx.shadowColor = isYou ? 'rgba(160, 80, 255, 0.5)' : 'rgba(0,0,0,0.15)'
  ctx.shadowBlur  = isYou ? 8 : 4
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(px - w / 2, py - 13, w, 18, 9); ctx.fill()
  } else {
    ctx.fillRect(px - w / 2, py - 13, w, 18)
  }
  ctx.shadowBlur = 0
  ctx.fillStyle  = isYou ? '#fff' : `hsla(${fish.hue || 270}, 45%, 25%, 0.95)`
  ctx.fillText(fish.name, px, py)
  ctx.restore()
}

// ── Proximity popup overlay ──
function ProximityBubble({ user, playerData, onViewProfile }) {
  if (!user) return null

  const myInterests  = playerData.interests || []
  const myGoals      = playerData.goals     || []
  const theirInterests = user.interests || []
  const theirGoals     = user.goals     || []

  // What they have that you want
  const theyHaveWhatIWant = myGoals.filter(g => theirInterests.includes(g))
  // What you have that they want
  const iHaveWhatTheyWant = myInterests.filter(i => theirGoals.includes(i))
  // Shared interests
  const sharedInterests = myInterests.filter(i => theirInterests.includes(i))

  const hasMatches = theyHaveWhatIWant.length || iHaveWhatTheyWant.length || sharedInterests.length

  return (
    <div className="proximity-bubble">
      <p className="proximity-name">{user.name}</p>

      {iHaveWhatTheyWant.length > 0 && (
        <div className="proximity-row">
          <span className="proximity-label">They're looking for — you have it</span>
          <span className="proximity-tags">{iHaveWhatTheyWant.slice(0, 3).join(' · ')}</span>
        </div>
      )}
      {theyHaveWhatIWant.length > 0 && (
        <div className="proximity-row">
          <span className="proximity-label">You're looking for — they have it</span>
          <span className="proximity-tags">{theyHaveWhatIWant.slice(0, 3).join(' · ')}</span>
        </div>
      )}
      {sharedInterests.length > 0 && (
        <div className="proximity-row">
          <span className="proximity-label">Both into</span>
          <span className="proximity-tags">{sharedInterests.slice(0, 3).join(' · ')}</span>
        </div>
      )}
      {!hasMatches && (
        <p className="proximity-row proximity-empty">No overlapping interests yet</p>
      )}

      <button className="proximity-btn" onClick={() => onViewProfile(user)}>
        View Profile
      </button>
    </div>
  )
}

export default function EventPage() {
  const { code }     = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()
  const canvasRef    = useRef(null)
  const eventName    = location.state?.name || code
  const nearbyRef    = useRef(null)
  const playerDataRef = useRef({ interests: [], goals: [] })

  const [showWelcome, setShowWelcome] = useState(true)
  const [nearbyUser,  setNearbyUser]  = useState(null)

  useEffect(() => {
    const t = setTimeout(() => setShowWelcome(false), 3500)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      const me      = loadProfile()
      const style   = getStyle(me.fish?.styleId)
      const myHue   = style.hue
      const myAccessories = {
        hat:     me.fish?.hat     || 'none',
        glasses: me.fish?.glasses || 'none',
        extra:   me.fish?.extra   || 'none',
      }

      const myId = (getSession()?.username || `fish-${Math.random().toString(36).slice(2, 7)}`).replace(/\./g, '_')

      const state = {
        player: {
          x: WORLD_W / 2, y: WORLD_H / 2,
          vx: 0, vy: 0, angle: 0, tailPhase: 0,
          styleId: style.id, hue: myHue, scale: 1.15,
          accessories: myAccessories,
          name:        'You',
          displayName: me.name || getSession()?.username || 'Anon',
          interests:   me.interests || [],
          goals:       me.goals     || [],
        },
        others: [],
        cam:  { x: WORLD_W / 2 - window.innerWidth / 2, y: WORLD_H / 2 - window.innerHeight / 2 },
        keys: {},
      }

      playerDataRef.current = { interests: state.player.interests, goals: state.player.goals }

      // Write full profile once so others can view it
      const profileRef = ref(db, `profiles/${myId}`)
      set(profileRef, {
        name:        me.name        || '',
        bio:         me.bio         || '',
        interests:   me.interests   || [],
        goals:       me.goals       || [],
        socials:     me.socials     || {},
        customLinks: me.customLinks || [],
        fish:        me.fish        || {},
      }).catch(() => {})

      const playerRef = ref(db, `events/${code}/${myId}`)
      onDisconnect(playerRef).remove()

      const broadcastId = setInterval(() => {
        set(playerRef, {
          name:      state.player.displayName,
          username:  myId,
          styleId:   state.player.styleId,
          hue:       state.player.hue,
          accessories: state.player.accessories,
          x:         Math.round(state.player.x),
          y:         Math.round(state.player.y),
          angle:     state.player.angle,
          scale:     state.player.scale,
          interests: state.player.interests,
          goals:     state.player.goals,
        }).catch(() => {})
      }, 100)

      const eventRef = ref(db, `events/${code}`)
      const unsub = onValue(eventRef, snapshot => {
        const data = snapshot.val() || {}
        for (const [id, val] of Object.entries(data)) {
          if (id === myId) continue
          const idx = state.others.findIndex(o => o.id === id)
          if (idx >= 0) Object.assign(state.others[idx], val)
          else state.others.push({ ...val, id, tailPhase: Math.random() * Math.PI * 2 })
        }
        for (let i = state.others.length - 1; i >= 0; i--) {
          if (!data[state.others[i].id]) state.others.splice(i, 1)
        }
      }, () => {})

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
        for (const o of others) o.tailPhase += 0.05

        cam.x += ((player.x - W / 2) - cam.x) * 0.09
        cam.y += ((player.y - H / 2) - cam.y) * 0.09
        cam.x = Math.max(0, Math.min(WORLD_W - W, cam.x))
        cam.y = Math.max(0, Math.min(WORLD_H - H, cam.y))

        ctx.clearRect(0, 0, W, H)
        ctx.save()
        ctx.translate(-(cam.x | 0), -(cam.y | 0))

        drawBackground(ctx, WORLD_W, WORLD_H, ts)
        updateSeaweed(DECO.seaweed, [player, ...others])
        drawSeaweedLayer(ctx, DECO.seaweed, 'bg', ts)
        for (const c of DECO.coral)   { ctx.save(); drawCoral(ctx, c); ctx.restore() }
        drawSeaweedLayer(ctx, DECO.seaweed, 'mid', ts)
        for (const b of DECO.bubbles) drawBubble(ctx, b, ts)
        drawBorder(ctx, WORLD_W, WORLD_H)

        for (const o of others) { drawFish(ctx, o); drawNameplate(ctx, o) }
        drawFish(ctx, player)
        drawNameplate(ctx, player)
        drawSeaweedLayer(ctx, DECO.seaweed, 'fg', ts)

        ctx.restore()

        // Update nearby user for React overlay
        let closest = null, closestDist = PROXIMITY_R
        for (const o of others) {
          const dist = Math.hypot(player.x - o.x, player.y - o.y)
          if (dist < closestDist) { closestDist = dist; closest = o }
        }
        if (closest?.id !== nearbyRef.current?.id) {
          nearbyRef.current = closest
          setNearbyUser(closest ? { ...closest } : null)
        }

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

  function handleViewProfile(user) {
    navigate(`/user/${user.username || user.id}`, { state: { user } })
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'absolute', top: 0, left: 0, backgroundColor: '#1a3a52' }}
      />
      <Navbar dark />

      {showWelcome && (
        <div className="welcome-toast">
          Welcome to <strong>{eventName}</strong>!
        </div>
      )}

      <div className="event-hud-code">
        <span className="hud-event-name">{eventName}</span>
        &nbsp;·&nbsp; {code} &nbsp;·&nbsp; WASD / arrows to swim
      </div>

      <ProximityBubble
        user={nearbyUser}
        playerData={playerDataRef.current}
        onViewProfile={handleViewProfile}
      />

      <button className="event-leave-btn" onClick={() => navigate('/')}>
        ← Leave
      </button>
    </div>
  )
}
