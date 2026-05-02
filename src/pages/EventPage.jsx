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
import { sendEventMessage, getAcceptedConnectionCount } from '../lib/chat'
import { playBubble } from '../lib/audio'
import jellyBlueCute from '../assets/jelly-blue-cute.png'

const { width: WORLD_W, height: WORLD_H } = WORLD
const { maxSpeed: MAX_SPEED, accel: ACCEL, friction: FRICTION } = MOVEMENT

const PROXIMITY_R = 110
const DECO = generateDecorations()

// Shared, module-scoped image so every fish renders the same sprite without
// re-decoding the PNG on every frame.
const CREATURE_IMG = new Image()
CREATURE_IMG.src = jellyBlueCute

// Draws the cute creature in place of a fish. Keeps the bob animation tied to
// `tailPhase` so it still feels alive while moving, and tilts gently in the
// direction of travel.
function drawCreature(ctx, fish) {
  if (!CREATURE_IMG.complete || !CREATURE_IMG.naturalWidth) return
  const size  = 78 * (fish.scale || 1)
  const bob   = Math.sin(fish.tailPhase || 0) * 0.06
  const lean  = Math.atan2(fish.vy || 0, fish.vx || 0)
  const speed = Math.hypot(fish.vx || 0, fish.vy || 0)
  // Only tilt when actually moving; idle creatures stay upright.
  const tilt  = speed > 0.4 ? Math.cos(lean) * 0.18 : 0
  ctx.save()
  ctx.translate(fish.x, fish.y)
  ctx.rotate(bob + tilt)
  ctx.drawImage(CREATURE_IMG, -size / 2, -size / 2, size, size)
  ctx.restore()
}

// ── Nameplate above each fish ──
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

// ── Animal Crossing-style speech bubble ──
function drawChatBubble(ctx, x, y, text, chars, age, maxAge) {
  const shown = Math.floor(chars)
  if (shown <= 0) return
  const alpha = age > maxAge * 0.72
    ? Math.max(0, 1 - (age - maxAge * 0.72) / (maxAge * 0.28))
    : 1
  if (alpha <= 0) return

  const displayed = text.slice(0, shown)
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = 'bold 11px system-ui, sans-serif'
  ctx.textAlign = 'center'

  const MAX_W = 160, PAD_X = 11, PAD_Y = 8, LINE_H = 15

  const words = displayed.split(' ')
  const lines = []
  let cur = ''
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w
    if (ctx.measureText(test).width > MAX_W && cur) {
      lines.push(cur); cur = w
      if (lines.length >= 2) break
    } else { cur = test }
  }
  if (cur && lines.length < 2) lines.push(cur)

  const bw = Math.min(Math.max(...lines.map(l => ctx.measureText(l).width)) + PAD_X * 2, MAX_W + PAD_X * 2)
  const bh = lines.length * LINE_H + PAD_Y * 2
  const bx = x, by = y - 60 - bh

  ctx.shadowColor = 'rgba(0,0,0,0.13)'
  ctx.shadowBlur  = 10
  ctx.shadowOffsetY = 3
  ctx.fillStyle = 'rgba(255,255,255,0.96)'
  if (ctx.roundRect) {
    ctx.beginPath(); ctx.roundRect(bx - bw / 2, by, bw, bh, 10); ctx.fill()
  } else { ctx.fillRect(bx - bw / 2, by, bw, bh) }

  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0
  ctx.beginPath()
  ctx.moveTo(bx - 7, by + bh)
  ctx.lineTo(bx + 7, by + bh)
  ctx.lineTo(bx, by + bh + 9)
  ctx.closePath(); ctx.fill()

  ctx.fillStyle = '#1a2a4a'
  lines.forEach((l, i) => ctx.fillText(l, bx, by + PAD_Y + 11 + i * LINE_H))
  ctx.restore()
}

// ── Proximity popup ──
function ProximityBubble({ user, playerData, onViewProfile }) {
  if (!user) return null
  const myInterests    = playerData.interests || []
  const myGoals        = playerData.goals     || []
  const theirInterests = user.interests || []
  const theirGoals     = user.goals     || []
  const theyHaveWhatIWant = myGoals.filter(g => theirInterests.includes(g))
  const iHaveWhatTheyWant = myInterests.filter(i => theirGoals.includes(i))
  const sharedInterests   = myInterests.filter(i => theirInterests.includes(i))
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
      {!hasMatches && <p className="proximity-row proximity-empty">No overlapping interests yet</p>}
      <button className="proximity-btn" onClick={() => onViewProfile(user)}>View Profile</button>
    </div>
  )
}

export default function EventPage() {
  const { code }      = useParams()
  const navigate      = useNavigate()
  const location      = useLocation()
  const canvasRef     = useRef(null)
  const eventName     = location.state?.name || code
  const nearbyRef     = useRef(null)
  const playerDataRef = useRef({ interests: [], goals: [] })
  const mouseTargetRef  = useRef(null)
  const myIdRef         = useRef(null)
  const displayNameRef  = useRef('')

  const [showWelcome,   setShowWelcome]   = useState(true)
  const [nearbyUser,    setNearbyUser]    = useState(null)
  const [chatOpen,      setChatOpen]      = useState(false)
  const [chatMessages,  setChatMessages]  = useState([])
  const [chatInput,     setChatInput]     = useState('')
  const chatBottomRef = useRef(null)

  useEffect(() => {
    playBubble()
    const t = setTimeout(() => setShowWelcome(false), 3500)
    return () => clearTimeout(t)
  }, [])

  // Scroll chat to bottom on new messages
  useEffect(() => {
    if (chatOpen) chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, chatOpen])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let cancelled = false
    let cleanup   = () => {}
    ;(async () => {
    let me
    try { me = await loadProfile() } catch { me = {} }
    if (cancelled) return
    try {
      const style   = getStyle(me.fish?.styleId)
      const myHue   = style.hue
      const myAccessories = {
        hat:     me.fish?.hat     || 'none',
        glasses: me.fish?.glasses || 'none',
        extra:   me.fish?.extra   || 'none',
      }

      const myId = (getSession()?.username || `fish-${Math.random().toString(36).slice(2, 7)}`).replace(/\./g, '_')
      myIdRef.current = myId

      // Fish grows with each accepted connection (caps at 1.8×)
      const friendCount = await getAcceptedConnectionCount()
      const fishScale = Math.min(1.8, 1.0 + friendCount * 0.04)

      // Persist this event in history so user can rejoin without re-entering code
      try {
        const hist = JSON.parse(localStorage.getItem('fishnet_events') || '{}')
        hist[code] = { ...hist[code], name: eventName, lastVisited: Date.now() }
        localStorage.setItem('fishnet_events', JSON.stringify(hist))
      } catch {}

      const state = {
        player: {
          x: WORLD_W / 2, y: WORLD_H / 2,
          vx: 0, vy: 0, angle: 0, tailPhase: 0,
          styleId: style.id, hue: myHue, scale: fishScale,
          accessories: myAccessories,
          name:        'You',
          displayName: me.name || getSession()?.username || 'Anon',
          interests:   me.interests || [],
          goals:       me.goals     || [],
        },
        others: [],
        bubbles: {},
        cam:  { x: WORLD_W / 2 - window.innerWidth / 2, y: WORLD_H / 2 - window.innerHeight / 2 },
        keys: {},
      }

      displayNameRef.current = state.player.displayName
      playerDataRef.current  = { interests: state.player.interests, goals: state.player.goals }

      // Write full profile so others can view it
      set(ref(db, `profiles/${myId}`), {
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
          name:        state.player.displayName,
          username:    myId,
          styleId:     state.player.styleId,
          hue:         state.player.hue,
          accessories: state.player.accessories,
          x:           Math.round(state.player.x),
          y:           Math.round(state.player.y),
          angle:       state.player.angle,
          scale:       state.player.scale,
          interests:   state.player.interests,
          goals:       state.player.goals,
        }).catch(() => {})
      }, 100)

      // Sync other fish
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

      // Event chat subscription — updates both the panel and in-world bubbles
      const seenMsgs = new Set()
      const chatRef  = ref(db, `event_chat/${code}`)
      const chatUnsub = onValue(chatRef, snap => {
        const data = snap.val() || {}
        const msgs = Object.entries(data)
          .map(([id, v]) => ({ id, ...v }))
          .sort((a, b) => a.ts - b.ts)
        setChatMessages(msgs.slice(-60))
        for (const msg of msgs) {
          if (!seenMsgs.has(msg.id)) {
            seenMsgs.add(msg.id)
            state.bubbles[msg.userId] = { text: msg.text.slice(0, 55), chars: 0, age: 0, maxAge: 240 }
          }
        }
      }, () => {})

      function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
      resize()
      window.addEventListener('resize', resize)

      function onCanvasClick(e) {
        const rect = canvas.getBoundingClientRect()
        mouseTargetRef.current = {
          x: (e.clientX - rect.left) + state.cam.x,
          y: (e.clientY - rect.top)  + state.cam.y,
        }
      }
      canvas.addEventListener('click', onCanvasClick)

      function onKeyDown(e) {
        const t = e.target
        if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA') return
        state.keys[e.key] = true
        mouseTargetRef.current = null
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault()
      }
      function onKeyUp(e) { state.keys[e.key] = false }
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup',   onKeyUp)

      let animId

      function loop(ts) {
        const { player, others, cam, keys, bubbles } = state
        const W = canvas.width, H = canvas.height

        const left  = keys['ArrowLeft']  || keys['a'] || keys['A']
        const right = keys['ArrowRight'] || keys['d'] || keys['D']
        const up    = keys['ArrowUp']    || keys['w'] || keys['W']
        const down  = keys['ArrowDown']  || keys['s'] || keys['S']

        if (left)  player.vx -= ACCEL
        if (right) player.vx += ACCEL
        if (up)    player.vy -= ACCEL
        if (down)  player.vy += ACCEL

        const mt = mouseTargetRef.current
        if (mt && !left && !right && !up && !down) {
          const dx = mt.x - player.x, dy = mt.y - player.y
          const dist = Math.hypot(dx, dy)
          if (dist < 18) { mouseTargetRef.current = null }
          else { player.vx += (dx / dist) * ACCEL; player.vy += (dy / dist) * ACCEL }
        }

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

        for (const o of others) { drawCreature(ctx, o); drawNameplate(ctx, o) }
        drawCreature(ctx, player)
        drawNameplate(ctx, player)
        drawSeaweedLayer(ctx, DECO.seaweed, 'fg', ts)

        // Advance and render Animal Crossing-style chat bubbles
        for (const uid of Object.keys(bubbles)) {
          const b = bubbles[uid]
          b.chars = Math.min(b.text.length, b.chars + 0.45)
          b.age++
          if (b.age >= b.maxAge) { delete bubbles[uid]; continue }
          const fishObj = uid === myId ? player : others.find(o => o.id === uid)
          if (fishObj) drawChatBubble(ctx, fishObj.x, fishObj.y, b.text, b.chars, b.age, b.maxAge)
        }

        ctx.restore()

        // Proximity detection
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
      cleanup = () => {
        cancelAnimationFrame(animId)
        clearInterval(broadcastId)
        unsub()
        chatUnsub()
        remove(playerRef)
        canvas.removeEventListener('click',   onCanvasClick)
        window.removeEventListener('resize',  resize)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup',   onKeyUp)
      }
    } catch (err) {
      console.error('EventPage error:', err)
    }
    })()
    return () => { cancelled = true; cleanup() }
  }, [])

  function handleViewProfile(user) {
    navigate(`/user/${user.username || user.id}`, { state: { user } })
  }

  function handleChatSend() {
    if (!chatInput.trim() || !myIdRef.current) return
    sendEventMessage(code, myIdRef.current, displayNameRef.current, chatInput)
    setChatInput('')
  }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', position: 'absolute', top: 0, left: 0, backgroundColor: '#1a3a52', cursor: 'crosshair' }}
      />
      <Navbar dark />

      {showWelcome && (
        <div className="welcome-toast">
          Welcome to <strong>{eventName}</strong>!
        </div>
      )}

      <div className="event-hud-code">
        <span className="hud-event-name">{eventName}</span>
        &nbsp;·&nbsp; {code} &nbsp;·&nbsp; WASD / click to swim
      </div>

      <ProximityBubble
        user={nearbyUser}
        playerData={playerDataRef.current}
        onViewProfile={handleViewProfile}
      />

      {/* ── Aquarium public chat panel ── */}
      <div className={`event-chat-panel ${chatOpen ? 'event-chat-open' : ''}`}>
        <div className="event-chat-hdr">
          <span className="event-chat-title">Aquarium Chat</span>
          <button className="event-chat-close" onClick={() => setChatOpen(false)}>×</button>
        </div>
        <div className="event-chat-msgs">
          {chatMessages.length === 0 && (
            <p className="event-chat-empty">Be the first to say something!</p>
          )}
          {chatMessages.map(msg => (
            <div key={msg.id} className={`event-chat-msg ${msg.userId === myIdRef.current ? 'ecm-mine' : ''}`}>
              <span className="ecm-name">{msg.displayName}</span>
              <span className="ecm-text">{msg.text}</span>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>
        <div className="event-chat-input-row">
          <input
            className="event-chat-input"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleChatSend() } }}
            placeholder="Say something..."
            maxLength={100}
          />
          <button className="event-chat-send" onClick={handleChatSend}>↑</button>
        </div>
      </div>

      {/* Chat toggle button */}
      <button className="event-chat-toggle" onClick={() => setChatOpen(o => !o)}>
        💬
        {!chatOpen && chatMessages.length > 0 && (
          <span className="event-chat-badge">{chatMessages.length > 9 ? '9+' : chatMessages.length}</span>
        )}
      </button>

      <button className="event-leave-btn" onClick={() => navigate('/')}>
        ← Leave
      </button>
    </div>
  )
}
