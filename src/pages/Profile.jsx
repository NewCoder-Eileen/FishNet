import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from '../lib/profile'
import { getSession, changeUsername, changeEmail, login, getAccountInfo } from '../lib/auth'
import { getStyle, drawFish } from '../aquarium/fishStyles'
import FishBowl from '../components/FishBowl'
import seaweedA from '../assets/seaweed-a.png'
import seaweedB from '../assets/seaweed-b.png'
import '../App.css'

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
      <span className="tag-hint">Press Enter or comma to add</span>
    </div>
  )
}

// ── Single fish swimming inside the bowl ──
function BowlFish({ styleId }) {
  const canvasRef = useRef(null)

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
      targetX: W / 2, targetY: H * 0.45,
      targetTimer: 0,
    }
    function aim() {
      fish.targetX = W * 0.22 + Math.random() * W * 0.56
      fish.targetY = H * 0.20 + Math.random() * H * 0.45
      fish.targetTimer = 140 + Math.random() * 240
    }
    aim()

    let raf = 0
    function loop() {
      ctx.clearRect(0, 0, W, H)
      const dx = fish.targetX - fish.x
      const dy = fish.targetY - fish.y
      const d  = Math.hypot(dx, dy) || 0.001
      fish.vx += (dx / d) * 0.04
      fish.vy += (dy / d) * 0.04
      fish.vx *= 0.93
      fish.vy *= 0.93
      const v = Math.hypot(fish.vx, fish.vy)
      if (v > 0.65) { fish.vx = (fish.vx / v) * 0.65; fish.vy = (fish.vy / v) * 0.65 }
      fish.x += fish.vx
      fish.y += fish.vy
      if (v > 0.05) fish.angle = Math.atan2(fish.vy, fish.vx)
      fish.tailPhase += 0.08 + v * 0.05
      fish.targetTimer -= 1
      if (d < 16 || fish.targetTimer <= 0) aim()
      drawFish(ctx, fish)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    function onResize() { ({ W, H } = resize()); aim() }
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

// ── The dots (categories shown over the rocks/seaweed) ──
const DOTS = [
  { id: 'about',     label: 'About',     color: 'blue',  top: '78%', left: '24%' },
  { id: 'contact',   label: 'Contact',   color: 'green', top: '83%', left: '40%' },
  { id: 'interests', label: 'Interests', color: 'blue',  top: '76%', left: '55%' },
  { id: 'resume',    label: 'Resume',    color: 'green', top: '82%', left: '70%' },
  { id: 'spotify',   label: 'Spotify',   color: 'blue',  top: '70%', left: '85%' },
]

// ── Page ──
export default function Profile() {
  const navigate    = useNavigate()
  const session     = getSession()
  const accountInfo = session ? getAccountInfo(session.username) : null

  const [profile, setProfile]           = useState(loadProfile)
  const [draft, setDraft]               = useState(null)         // working copy while a modal is open
  const [openSection, setOpenSection]   = useState(null)         // dot id currently open
  const [fishEditOpen, setFishEditOpen] = useState(false)
  const [accountOpen, setAccountOpen]   = useState(false)
  const [savedFlash, setSavedFlash]     = useState(false)

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

        {/* Fish swimming */}
        <BowlFish styleId={fish.styleId} />

        {/* Username overlay */}
        <div className="bowl-name-tag">
          <p className="bowl-username">@{session?.username || 'guest'}</p>
          {profile.name && <p className="bowl-display-name">{profile.name}</p>}
        </div>

        {/* Seaweed */}
        <img src={seaweedA} alt="" className="bowl-seaweed seaweed-left"   aria-hidden />
        <img src={seaweedB} alt="" className="bowl-seaweed seaweed-mid"    aria-hidden />
        <img src={seaweedA} alt="" className="bowl-seaweed seaweed-right"  aria-hidden />

        {/* Sand + rocks */}
        <div className="bowl-sand" aria-hidden />
        <div className="bowl-rocks" aria-hidden>
          <span className="rock rock-1" />
          <span className="rock rock-2" />
          <span className="rock rock-3" />
          <span className="rock rock-4" />
          <span className="rock rock-5" />
        </div>

        {/* Glowing info dots */}
        {DOTS.map(d => (
          <button
            key={d.id}
            className={`bowl-dot bowl-dot-${d.color}`}
            style={{ top: d.top, left: d.left }}
            onClick={() => startEdit(d.id)}
            aria-label={d.label}
            title={d.label}
          />
        ))}

        <p className="bowl-dot-hint">↓ Tap a glowing dot to view or edit ↓</p>

        {/* Bottom toolbar (edit fish + account) */}
        <div className="bowl-toolbar">
          <button className="glass-btn" onClick={() => setFishEditOpen(true)}>🐟 Pick fish</button>
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

      {openSection === 'spotify' && draft && (
        <SectionModal title="Spotify Playlist" onClose={cancel} onSave={commit}>
          <label className="profile-field">
            <span>Playlist URL</span>
            <input className="profile-input" value={draft.spotifyPlaylist || ''}
              onChange={e => setDraft({ ...draft, spotifyPlaylist: e.target.value })}
              placeholder="https://open.spotify.com/playlist/..." />
          </label>
          {draft.spotifyPlaylist && (
            <p className="field-note-block">
              Preview: <a href={draft.spotifyPlaylist} target="_blank" rel="noreferrer" className="link">{draft.spotifyPlaylist}</a>
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
