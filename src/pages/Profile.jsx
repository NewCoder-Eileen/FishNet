import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from '../lib/profile'
import { getSession, changeUsername, changeEmail, login, getAccountInfo } from '../lib/auth'
import { getStyle, drawFish } from '../aquarium/fishStyles'
import FishBowl from '../components/FishBowl'
import seaweedA from '../assets/seaweed-a.png'
import seaweedB from '../assets/seaweed-b.png'
import '../App.css'

// Format the @handle nicely. If the username already contains an @ (it's
// shaped like an email), show it raw — otherwise prefix it with @.
function fmtHandle(username) {
  if (!username) return '@guest'
  return username.includes('@') ? username : `@${username}`
}

// Convert a Spotify share URL into the embeddable iframe URL.
// Returns null if the URL doesn't look like a Spotify resource.
function extractSpotifyEmbed(rawUrl) {
  if (!rawUrl) return null
  try {
    const url = new URL(rawUrl.trim())
    if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null
    const m = url.pathname.match(/^\/(?:embed\/)?(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/)
    if (!m) return null
    return `https://open.spotify.com/embed/${m[1]}/${m[2]}`
  } catch {
    return null
  }
}

const SOCIALS = [
  { key: 'github',   label: 'GitHub',       placeholder: 'https://github.com/yourusername' },
  { key: 'linkedin', label: 'LinkedIn',     placeholder: 'https://linkedin.com/in/yourusername' },
  { key: 'twitter',  label: 'Twitter / X',  placeholder: 'https://x.com/yourusername' },
  { key: 'devpost',  label: 'Devpost',      placeholder: 'https://devpost.com/yourusername' },
  { key: 'website',  label: 'Personal Site',placeholder: 'https://yourname.com' },
  { key: 'email',    label: 'Email',        placeholder: 'you@example.com' },
]

// ── Tag input (interests / goals) ──
function TagInput({ value, onChange, placeholder }) {
  const [draft, setDraft] = useState('')
  const tags = value || []
  function addTag() {
    const tag = draft.trim().toLowerCase()
    if (tag && !tags.includes(tag)) onChange([...tags, tag])
    setDraft('')
  }
  return (
    <div className="tag-input">
      <div className="tag-list">
        {tags.map((tag, i) => (
          <button key={i} type="button" className="tag-pill"
            onClick={() => onChange(tags.filter((_, j) => j !== i))}>
            {tag} <span className="tag-pill-x">×</span>
          </button>
        ))}
        <input className="tag-draft" value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() }
            else if (e.key === 'Backspace' && !draft && tags.length > 0) onChange(tags.slice(0, -1))
          }}
          onBlur={addTag} placeholder={tags.length === 0 ? placeholder : ''} />
      </div>
      <span className="tag-hint">Press Enter to add</span>
    </div>
  )
}

// ── Static fish preview (used in the bowl id-card square) ──
function FishPreview({ styleId, width = 84, height = 84 }) {
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
    const fish = {
      styleId: style.id,
      x: width / 2, y: height / 2,
      angle: 0, tailPhase: 0,
      scale: Math.min(width, height) / 75,
    }
    let raf = 0
    function loop(ts) {
      ctx.clearRect(0, 0, width, height)
      fish.tailPhase = ts * 0.005
      drawFish(ctx, fish)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [styleId, width, height])
  return <canvas ref={ref} style={{ width, height, display: 'block' }} aria-hidden />
}

// ── Single fish swimming inside the bowl, controlled by WASD / arrow keys ──
// Props:
//   dots:          [{ id, xPct, yPct, hitR }]  — proximity targets in canvas space
//   onDotEnter(id) — fired once per swim-in event for each dot
//   hintRef        — DOM element that we position right above the fish
function BowlFish({ styleId, dots = [], onDotEnter, hintRef }) {
  const canvasRef = useRef(null)
  const keysRef   = useRef({})

  // Tunables
  const ACCEL    = 0.48
  const FRICTION = 0.91
  const MAX_V    = 4.6

  useEffect(() => {
    function onKeyDown(e) {
      const t = e.target
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      keysRef.current[e.key] = true
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault()
    }
    function onKeyUp(e) { keysRef.current[e.key] = false }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [])

  // Latest props in a ref so the loop reads fresh values without rebooting.
  const propsRef = useRef({ dots, onDotEnter, hintRef })
  useEffect(() => { propsRef.current = { dots, onDotEnter, hintRef } }, [dots, onDotEnter, hintRef])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      const W = canvas.clientWidth
      const H = canvas.clientHeight
      canvas.width  = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      return { W, H }
    }
    let { W, H } = resize()

    const fish = {
      styleId,
      x: W / 2, y: H * 0.45,
      vx: 0, vy: 0,
      angle: 0,
      tailPhase: 0,
      scale: 1.6,
    }
    const dotState = new Map()   // id → { inside: bool }

    let raf = 0
    function loop() {
      ctx.clearRect(0, 0, W, H)

      const k = keysRef.current
      const left  = k['ArrowLeft']  || k['a'] || k['A']
      const right = k['ArrowRight'] || k['d'] || k['D']
      const up    = k['ArrowUp']    || k['w'] || k['W']
      const down  = k['ArrowDown']  || k['s'] || k['S']

      if (left)  fish.vx -= ACCEL
      if (right) fish.vx += ACCEL
      if (up)    fish.vy -= ACCEL
      if (down)  fish.vy += ACCEL

      fish.vx *= FRICTION
      fish.vy *= FRICTION

      const v = Math.hypot(fish.vx, fish.vy)
      if (v > MAX_V) { fish.vx = (fish.vx / v) * MAX_V; fish.vy = (fish.vy / v) * MAX_V }

      fish.x += fish.vx
      fish.y += fish.vy

      // Keep inside an inset ellipse
      const cx = W / 2, cy = H / 2
      const rx = W * 0.46, ry = H * 0.46
      const ex = (fish.x - cx) / rx
      const ey = (fish.y - cy) / ry
      const er = Math.hypot(ex, ey)
      if (er > 1) {
        fish.x = cx + (ex / er) * rx
        fish.y = cy + (ey / er) * ry
        const nx = ex / er, ny = ey / er
        const dotV = fish.vx * nx + fish.vy * ny
        if (dotV > 0) {
          fish.vx -= dotV * nx
          fish.vy -= dotV * ny
          fish.vx *= 0.5; fish.vy *= 0.5
        }
      }

      if (v > 0.15) fish.angle = Math.atan2(fish.vy, fish.vx)
      fish.tailPhase += 0.08 + v * 0.04

      drawFish(ctx, fish)

      // Dot proximity — fire onDotEnter once per swim-in
      const pp = propsRef.current
      for (const d of pp.dots) {
        const dx = d.xPct * W - fish.x
        const dy = d.yPct * H - fish.y
        const dist = Math.hypot(dx, dy)
        const r = d.hitR ?? 36
        const wasInside = dotState.get(d.id)?.inside || false
        const inside = dist < r
        if (inside && !wasInside) pp.onDotEnter?.(d.id)
        dotState.set(d.id, { inside })
      }

      // Position the floating hint directly above the fish (DOM-only update,
      // no React re-render).
      const hintEl = pp.hintRef?.current
      if (hintEl) {
        hintEl.style.left = `${fish.x}px`
        hintEl.style.top  = `${fish.y - 44}px`
      }

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    function onResize() { ({ W, H } = resize()) }
    window.addEventListener('resize', onResize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize) }
  }, [styleId])

  return <canvas ref={canvasRef} className="bowl-fish-canvas" aria-hidden />
}

// ── Generic section editor modal ──
function SectionModal({ title, onClose, onSave, children }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal section-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal glass-btn" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-header">
          <h2>{title}</h2>
        </div>
        <div className="section-modal-body">{children}</div>
        <div className="modal-actions">
          <button className="join-btn-primary" onClick={onSave}>Save</button>
          <button className="glass-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Fish-picker modal (the smaller bowl with all 8 fish) ──
function FishEditModal({ fish, updateFish, onSave, onClose }) {
  const selectedStyle = getStyle(fish.styleId)
  return (
    <div className="fish-edit-modal-overlay" onClick={onClose}>
      <div className="fish-edit-modal" onClick={e => e.stopPropagation()}>
        <button className="fish-modal-close" onClick={onClose}>×</button>
        <h2 className="join-title" style={{ marginBottom: 4 }}>Pick Your Fish</h2>
        <p className="join-desc" style={{ marginBottom: 12 }}>Tap a fish to make it yours.</p>

        <FishBowl
          selectedStyleId={fish.styleId}
          onSelect={(id) => updateFish('styleId', id)}
        />

        <p className="fishbowl-hint">Selected: {selectedStyle.label}</p>

        <button className="join-btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onSave}>
          Save Changes
        </button>
      </div>
    </div>
  )
}

// ── Account credentials modal (username + email change) ──
function AccountModal({ session, accountInfo, onClose }) {
  const [usernameMode,     setUsernameMode]     = useState('idle')
  const [newUsername,      setNewUsername]      = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameError,    setUsernameError]    = useState('')
  const [emailStep,        setEmailStep]        = useState(0)
  const [emailPassword,    setEmailPassword]    = useState('')
  const [newEmail,         setNewEmail]         = useState('')
  const [confirmEmail,     setConfirmEmail]     = useState('')
  const [emailError,       setEmailError]       = useState('')

  function handleUsernameConfirm() {
    if (!session) return
    const result = changeUsername(session.username, usernamePassword, newUsername)
    if (!result.ok) { setUsernameError(result.error); return }
    setUsernameMode('idle'); setUsernamePassword(''); setUsernameError('')
  }
  function handleEmailVerify() {
    if (!session) return
    const result = login(session.username, emailPassword)
    if (!result.ok) { setEmailError('Incorrect password.'); return }
    setEmailError(''); setEmailStep(2)
  }
  function handleEmailConfirm() {
    if (!session) return
    if (!newEmail)                  { setEmailError('Email cannot be empty.'); return }
    if (newEmail !== confirmEmail)  { setEmailError("Emails don't match."); return }
    const result = changeEmail(session.username, emailPassword, newEmail)
    if (!result.ok) { setEmailError(result.error); return }
    setEmailStep(3); setEmailPassword(''); setNewEmail(''); setConfirmEmail(''); setEmailError('')
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal section-modal" onClick={e => e.stopPropagation()}>
        <button className="close-modal glass-btn" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-header"><h2>Account</h2></div>

        <div className="section-modal-body">
          <div className="profile-field">
            <span>Username <span className="field-note">(your unique login ID)</span></span>
            {usernameMode === 'idle' ? (
              <div className="cred-row">
                <span className="cred-display">@{session?.username || '—'}</span>
                <button className="glass-btn small" onClick={() => {
                  setNewUsername(session?.username || ''); setUsernameMode('editing')
                }}>Edit</button>
              </div>
            ) : (
              <div className="cred-edit-block">
                <input className="profile-input" value={newUsername}
                  onChange={e => setNewUsername(e.target.value)} placeholder="New username" autoFocus />
                <input className="profile-input" type="password" value={usernamePassword}
                  onChange={e => setUsernamePassword(e.target.value)} placeholder="Confirm with password" />
                {usernameError && <p className="field-error">{usernameError}</p>}
                <div className="cred-actions">
                  <button className="join-btn-primary cred-confirm-btn" onClick={handleUsernameConfirm}>Confirm</button>
                  <button className="glass-btn" onClick={() => {
                    setUsernameMode('idle'); setUsernameError(''); setUsernamePassword('')
                  }}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          <div className="profile-field">
            <span>Email <span className="field-note">(for account recovery)</span></span>
            {emailStep === 0 && (
              <div className="cred-row">
                <span className="cred-display">{accountInfo?.email || <em className="field-note">Not set</em>}</span>
                <button className="glass-btn small" onClick={() => setEmailStep(1)}>Change</button>
              </div>
            )}
            {emailStep === 1 && (
              <div className="cred-edit-block">
                <p className="field-note-block">Enter your password to continue.</p>
                <input className="profile-input" type="password" value={emailPassword}
                  onChange={e => setEmailPassword(e.target.value)} placeholder="Current password" autoFocus />
                {emailError && <p className="field-error">{emailError}</p>}
                <div className="cred-actions">
                  <button className="join-btn-primary cred-confirm-btn" onClick={handleEmailVerify}>Next</button>
                  <button className="glass-btn" onClick={() => { setEmailStep(0); setEmailError(''); setEmailPassword('') }}>Cancel</button>
                </div>
              </div>
            )}
            {emailStep === 2 && (
              <div className="cred-edit-block">
                <input className="profile-input" type="email" value={newEmail}
                  onChange={e => setNewEmail(e.target.value)} placeholder="New email" autoFocus />
                <input className="profile-input" type="email" value={confirmEmail}
                  onChange={e => setConfirmEmail(e.target.value)} placeholder="Confirm new email" />
                {emailError && <p className="field-error">{emailError}</p>}
                <div className="cred-actions">
                  <button className="join-btn-primary cred-confirm-btn" onClick={handleEmailConfirm}>Confirm</button>
                  <button className="glass-btn" onClick={() => {
                    setEmailStep(0); setEmailError(''); setNewEmail(''); setConfirmEmail('')
                  }}>Cancel</button>
                </div>
              </div>
            )}
            {emailStep === 3 && (
              <div className="cred-row">
                <span className="field-success">✓ Email updated</span>
                <button className="glass-btn small" onClick={() => setEmailStep(0)}>Done</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Seaweed clumps along the bottom ──
// Pairs of (src, position, size, mirror, delay) — varied sizes + a few overlaps
// so the floor reads as a planted patch instead of a spaced-out trio.
const SEAWEEDS = [
  { src: seaweedA, leftPct:  2,  size: 170, bottom:  0, mirror: false, delay: -1.2, op: 0.95 },
  { src: seaweedB, leftPct: 12,  size: 130, bottom: -2, mirror: true,  delay: -2.1, op: 0.85 },
  { src: seaweedA, leftPct: 22,  size: 200, bottom: -2, mirror: false, delay: -3.4, op: 0.92 },
  { src: seaweedB, leftPct: 34,  size: 240, bottom: -3, mirror: false, delay: -3.0, op: 0.95 },
  { src: seaweedA, leftPct: 46,  size: 145, bottom: -1, mirror: true,  delay: -4.5, op: 0.85 },
  { src: seaweedB, leftPct: 56,  size: 200, bottom: -2, mirror: false, delay: -2.8, op: 0.93 },
  { src: seaweedA, leftPct: 68,  size: 160, bottom: -2, mirror: true,  delay: -3.7, op: 0.88 },
  { src: seaweedB, leftPct: 78,  size: 130, bottom: -1, mirror: false, delay: -1.5, op: 0.85 },
  { src: seaweedA, leftPct: 88,  size: 180, bottom:  0, mirror: true,  delay: -4.0, op: 0.95 },
]

// ── The dots (3 sections: playlist / interests / resume) ──
// xPct/yPct are positions inside the canvas (0..1). topPct/leftPct are CSS
// positions for the visible dot button (same value, expressed as %).
const DOTS = [
  { id: 'playlist',  label: 'Playlist',  color: 'blue',  xPct: 0.20, yPct: 0.78 },
  { id: 'interests', label: 'Interests', color: 'green', xPct: 0.50, yPct: 0.86 },
  { id: 'resume',    label: 'Resume',    color: 'blue',  xPct: 0.80, yPct: 0.78 },
]

// ── Page ──
export default function Profile() {
  const navigate    = useNavigate()
  const session     = getSession()
  const accountInfo = session ? getAccountInfo(session.username) : null

  const [profile, setProfile]           = useState(loadProfile)
  const [draft, setDraft]               = useState(null)
  const [openSection, setOpenSection]   = useState(null)
  const [fishEditOpen, setFishEditOpen] = useState(false)
  const [accountOpen, setAccountOpen]   = useState(false)
  const [savedFlash, setSavedFlash]     = useState(false)
  const hintRef = useRef(null)
  const lastDotEnterRef = useRef(0)

  // Open the right modal when the fish swims into a dot. Throttle so we don't
  // re-open immediately if the user closes and lingers.
  function handleDotEnter(id) {
    if (openSection || draft || fishEditOpen || accountOpen) return
    const now = performance.now()
    if (now - lastDotEnterRef.current < 1200) return
    lastDotEnterRef.current = now
    startEdit(id)
  }

  function startEdit(section) {
    setDraft({ ...profile, socials: { ...(profile.socials || {}) }, customLinks: [...(profile.customLinks || [])] })
    setOpenSection(section)
  }

  function commit() {
    if (!draft) return
    saveProfile(draft)
    setProfile(draft)
    setDraft(null)
    setOpenSection(null)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  function cancel() {
    setDraft(null)
    setOpenSection(null)
  }

  // Fish picker reads/writes directly to live profile (no modal-draft roundtrip).
  function updateFish(key, value) {
    setProfile(p => ({ ...p, fish: { ...(p.fish || {}), [key]: value } }))
  }
  function handleFishSave() {
    saveProfile(profile)
    setFishEditOpen(false)
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 1800)
  }

  const fish = profile.fish || {}

  return (
    <div className="profile-fishbowl-page">
      <button className="join-back" onClick={() => navigate('/')}>← Back</button>

      <div className="profile-fishbowl">
        {/* Water + glass shine */}
        <div className="profile-fishbowl-water" />
        <div className="fishbowl-shine" aria-hidden />
        <div className="fishbowl-water-line" aria-hidden />

        {/* Fish swimming — controllable with WASD / arrows, fills entire bowl */}
        <BowlFish
          styleId={fish.styleId}
          dots={DOTS}
          onDotEnter={handleDotEnter}
          hintRef={hintRef}
        />

        {/* Identity card — fish square + username + inline contact */}
        <div className="bowl-id-card">
          <button
            type="button"
            className="bowl-fish-square bowl-fish-square-btn"
            onClick={() => setFishEditOpen(true)}
            title="Click to change your fish"
            aria-label="Change your fish"
          >
            <FishPreview styleId={fish.styleId} width={84} height={84} />
            <span className="bowl-fish-square-overlay">
              <span className="bowl-fish-square-overlay-text">Change</span>
            </span>
          </button>
          <div className="bowl-id-text">
            <div className="bowl-username-row">
              <p className="bowl-username">
                {profile.name || fmtHandle(session?.username)}
              </p>
              <button className="bowl-edit-info-btn" onClick={() => startEdit('about')} title="Edit name & bio" aria-label="Edit name & bio">✏</button>
            </div>
            {profile.name && session?.username && (
              <p className="bowl-display-name">{fmtHandle(session.username)}</p>
            )}
            <div className="bowl-contact-row">
              {profile.socials?.email    && <a className="bowl-contact-chip" href={`mailto:${profile.socials.email}`} title={profile.socials.email}>✉ Email</a>}
              {profile.socials?.github   && <a className="bowl-contact-chip" href={profile.socials.github}   target="_blank" rel="noreferrer">GitHub</a>}
              {profile.socials?.linkedin && <a className="bowl-contact-chip" href={profile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
              {profile.socials?.twitter  && <a className="bowl-contact-chip" href={profile.socials.twitter}  target="_blank" rel="noreferrer">Twitter</a>}
              {profile.socials?.devpost  && <a className="bowl-contact-chip" href={profile.socials.devpost}  target="_blank" rel="noreferrer">Devpost</a>}
              {profile.socials?.website  && <a className="bowl-contact-chip" href={profile.socials.website}  target="_blank" rel="noreferrer">Site</a>}
              {!profile.socials || Object.values(profile.socials).every(v => !v)
                ? <button className="bowl-contact-chip ghost" onClick={() => startEdit('contact')}>+ Add contact</button>
                : <button className="bowl-contact-chip ghost" onClick={() => startEdit('contact')}>Edit</button>}
            </div>
          </div>
        </div>

        {/* Seaweed — dense bed of clumps along the bottom */}
        {SEAWEEDS.map((s, i) => (
          <img
            key={i}
            src={s.src}
            alt=""
            aria-hidden
            className={`bowl-seaweed${s.mirror ? ' seaweed-mirror' : ''}`}
            style={{
              left:    `${s.leftPct}%`,
              bottom:  `${s.bottom}%`,
              width:   s.size,
              opacity: s.op,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}

        {/* Sand + rocks */}
        <div className="bowl-sand" aria-hidden />
        <div className="bowl-rocks" aria-hidden>
          <span className="rock rock-1" />
          <span className="rock rock-2" />
          <span className="rock rock-3" />
          <span className="rock rock-4" />
          <span className="rock rock-5" />
        </div>

        {/* Floating hint above the fish (DOM-positioned by BowlFish) */}
        <div ref={hintRef} className="bowl-fish-hint" aria-hidden>
          <span>swim to a glowing dot</span>
          <span className="bowl-fish-hint-tail" />
        </div>

        {/* Glowing info dots — same percentages used for canvas-space proximity */}
        {DOTS.map(d => (
          <button
            key={d.id}
            className={`bowl-dot bowl-dot-${d.color}`}
            style={{ left: `${d.xPct * 100}%`, top: `${d.yPct * 100}%` }}
            onClick={() => startEdit(d.id)}
            aria-label={d.label}
            title={d.label}
          >
            <span className="bowl-dot-tooltip">{d.label}</span>
          </button>
        ))}

        {/* Bottom toolbar */}
        <div className="bowl-toolbar">
          <button className="glass-btn" onClick={() => setAccountOpen(true)}>⚙ Account</button>
        </div>

        {savedFlash && <div className="bowl-saved-flash">✓ Saved</div>}
      </div>

      {/* ── Section modals ── */}
      {openSection === 'about' && draft && (
        <SectionModal title="About" onClose={cancel} onSave={commit}>
          <label className="profile-field">
            <span>Nickname</span>
            <input className="profile-input" value={draft.name}
              onChange={e => setDraft({ ...draft, name: e.target.value })}
              placeholder="Your display name" />
          </label>
          <label className="profile-field">
            <span>Bio</span>
            <textarea className="profile-input profile-textarea" value={draft.bio}
              onChange={e => setDraft({ ...draft, bio: e.target.value })}
              placeholder="Builder, hacker, fish enthusiast..." rows={4} />
          </label>
        </SectionModal>
      )}

      {openSection === 'contact' && draft && (
        <SectionModal title="Contact" onClose={cancel} onSave={commit}>
          {SOCIALS.map(s => (
            <label key={s.key} className="profile-field">
              <span>{s.label}</span>
              <input className="profile-input"
                value={draft.socials?.[s.key] || ''}
                onChange={e => setDraft({ ...draft, socials: { ...draft.socials, [s.key]: e.target.value } })}
                placeholder={s.placeholder} />
            </label>
          ))}
        </SectionModal>
      )}

      {openSection === 'interests' && draft && (
        <SectionModal title="Interests & Looking For" onClose={cancel} onSave={commit}>
          <div className="profile-field">
            <span>Interests <span className="field-note">(what you build, study, care about)</span></span>
            <TagInput value={draft.interests} onChange={tags => setDraft({ ...draft, interests: tags })} placeholder="ai, design, climate..." />
          </div>
          <div className="profile-field">
            <span>Looking For <span className="field-note">(who you want to meet)</span></span>
            <TagInput value={draft.goals} onChange={tags => setDraft({ ...draft, goals: tags })} placeholder="cofounder, internship, mentor..." />
          </div>
        </SectionModal>
      )}

      {openSection === 'resume' && draft && (
        <SectionModal title="Resume & Links" onClose={cancel} onSave={commit}>
          <label className="profile-field">
            <span>Resume</span>
            <input className="profile-input" value={draft.resume || ''}
              onChange={e => setDraft({ ...draft, resume: e.target.value })}
              placeholder="https://link-to-your-resume" />
          </label>
          <div className="profile-field">
            <span>Other Links <span className="field-note">(portfolio, blog, anything else)</span></span>
            {(draft.customLinks || []).map((link, idx) => (
              <div key={idx} className="profile-custom-row">
                <input className="profile-input profile-custom-label" value={link.label}
                  onChange={e => setDraft({ ...draft, customLinks: draft.customLinks.map((l, i) => i === idx ? { ...l, label: e.target.value } : l) })}
                  placeholder="Label" />
                <input className="profile-input profile-custom-url" value={link.url}
                  onChange={e => setDraft({ ...draft, customLinks: draft.customLinks.map((l, i) => i === idx ? { ...l, url: e.target.value } : l) })}
                  placeholder="https://..." />
                <button type="button" className="profile-remove-btn"
                  onClick={() => setDraft({ ...draft, customLinks: draft.customLinks.filter((_, i) => i !== idx) })} aria-label="Remove">×</button>
              </div>
            ))}
            <button type="button" className="join-btn-create"
              onClick={() => setDraft({ ...draft, customLinks: [...(draft.customLinks || []), { label: '', url: '' }] })}>
              + Add a link
            </button>
          </div>
        </SectionModal>
      )}

      {openSection === 'playlist' && draft && (
        <SectionModal title="Playlist" onClose={cancel} onSave={commit}>
          <p className="field-note-block">
            Drop a Spotify playlist link so people who visit your bowl can vibe with you.
          </p>
          <label className="profile-field">
            <span>Spotify Playlist URL</span>
            <div className="spotify-input-row">
              <span className="spotify-input-icon" aria-hidden>🎵</span>
              <input
                className="profile-input spotify-input"
                value={draft.spotifyPlaylist || ''}
                onChange={e => setDraft({ ...draft, spotifyPlaylist: e.target.value })}
                placeholder="https://open.spotify.com/playlist/..."
              />
            </div>
          </label>

          {draft.spotifyPlaylist && extractSpotifyEmbed(draft.spotifyPlaylist) && (
            <div className="spotify-embed-wrap">
              <iframe
                title="Spotify playlist preview"
                src={extractSpotifyEmbed(draft.spotifyPlaylist)}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          )}

          {draft.spotifyPlaylist && !extractSpotifyEmbed(draft.spotifyPlaylist) && (
            <p className="field-note-block">
              Saved: <a href={draft.spotifyPlaylist} target="_blank" rel="noreferrer" className="link">{draft.spotifyPlaylist}</a>
            </p>
          )}
        </SectionModal>
      )}

      {fishEditOpen && (
        <FishEditModal
          fish={fish}
          updateFish={updateFish}
          onSave={handleFishSave}
          onClose={() => setFishEditOpen(false)}
        />
      )}

      {accountOpen && (
        <AccountModal
          session={session}
          accountInfo={accountInfo}
          onClose={() => setAccountOpen(false)}
        />
      )}
    </div>
  )
}
