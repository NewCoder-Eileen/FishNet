import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from '../lib/profile'
import { getSession, changeUsername, changeEmail, login, getAccountInfo } from '../lib/auth'
import { FISH_STYLES, getStyle, drawFish } from '../aquarium/fishStyles'
import { MOCK_PROFILES } from '../data/mockProfiles'
import BubbleBackground from '../components/BubbleBackground'
import '../App.css'

const SOCIALS = [
  { key: 'github',   label: 'GitHub',       placeholder: 'https://github.com/yourusername' },
  { key: 'linkedin', label: 'LinkedIn',      placeholder: 'https://linkedin.com/in/yourusername' },
  { key: 'twitter',  label: 'Twitter / X',   placeholder: 'https://x.com/yourusername' },
  { key: 'devpost',  label: 'Devpost',       placeholder: 'https://devpost.com/yourusername' },
  { key: 'website',  label: 'Personal Site', placeholder: 'https://yourname.com' },
  { key: 'email',    label: 'Email',         placeholder: 'you@example.com' },
]

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

function FishPreview({ styleId, width = 200, height = 110 }) {
  const ref = useRef(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, width, height)
    const bg = ctx.createLinearGradient(0, 0, 0, height)
    bg.addColorStop(0, 'rgba(100, 180, 240, 0.22)')
    bg.addColorStop(1, 'rgba(40, 80, 160, 0.32)')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, width, height)
    const style = getStyle(styleId)
    drawFish(ctx, {
      x: width / 2, y: height * 0.58, angle: 0, tailPhase: 0.5,
      scale: width / 130,
      styleId: style.id,
    })
  }, [styleId, width, height])
  return <canvas ref={ref} width={width} height={height} className="fish-preview-canvas" />
}

function FishEditModal({ fish, updateFish, onSave, onClose }) {
  return (
    <div className="fish-edit-modal-overlay" onClick={onClose}>
      <div className="fish-edit-modal" onClick={e => e.stopPropagation()}>
        <button className="fish-modal-close" onClick={onClose}>×</button>
        <h2 className="join-title" style={{ marginBottom: 4 }}>Edit Your Fish</h2>
        <p className="join-desc" style={{ marginBottom: 12 }}>Choose your look in the aquarium.</p>

        <FishPreview styleId={fish.styleId} />

        <p className="acc-section-label">Style</p>
        <div className="fish-style-grid">
          {FISH_STYLES.map(s => (
            <button key={s.id} type="button"
              className={`fish-style-card${fish.styleId === s.id ? ' selected' : ''}`}
              onClick={() => updateFish('styleId', s.id)}>
              <div className="fish-style-swatch">
                <img
                  src={s.image}
                  alt={s.label}
                  className="fish-style-img"
                  style={{ transform: s.naturalFacing === 'left' ? 'scaleX(-1)' : 'none' }}
                />
              </div>
              <span className="fish-style-label">{s.label}</span>
            </button>
          ))}
        </div>

        <button className="join-btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={onSave}>
          Save Changes
        </button>
      </div>
    </div>
  )
}

export default function Profile() {
  const navigate    = useNavigate()
  const session     = getSession()
  const accountInfo = session ? getAccountInfo(session.username) : null

  const [profile, setProfile] = useState(loadProfile)
  const [saved, setSaved]     = useState(false)
  const [fishEditOpen, setFishEditOpen] = useState(false)

  // ── Username edit ──
  const [usernameMode, setUsernameMode]         = useState('idle')
  const [newUsername, setNewUsername]           = useState('')
  const [usernamePassword, setUsernamePassword] = useState('')
  const [usernameError, setUsernameError]       = useState('')

  // ── Email change ──
  const [emailStep, setEmailStep]         = useState(0)
  const [emailPassword, setEmailPassword] = useState('')
  const [newEmail, setNewEmail]           = useState('')
  const [confirmEmail, setConfirmEmail]   = useState('')
  const [emailError, setEmailError]       = useState('')

  function updateField(field, value) { setProfile(p => ({ ...p, [field]: value })) }
  function updateFish(key, value)    { setProfile(p => ({ ...p, fish: { ...(p.fish || {}), [key]: value } })) }
  function updateSocial(key, value)  { setProfile(p => ({ ...p, socials: { ...p.socials, [key]: value } })) }
  function toggleConnection(id) {
    setProfile(p => {
      const list = p.connections || []
      return { ...p, connections: list.includes(id) ? list.filter(x => x !== id) : [...list, id] }
    })
  }
  function addCustomLink() { setProfile(p => ({ ...p, customLinks: [...p.customLinks, { label: '', url: '' }] })) }
  function updateCustomLink(idx, field, value) {
    setProfile(p => ({ ...p, customLinks: p.customLinks.map((l, i) => i === idx ? { ...l, [field]: value } : l) }))
  }
  function removeCustomLink(idx) {
    setProfile(p => ({ ...p, customLinks: p.customLinks.filter((_, i) => i !== idx) }))
  }

  function handleSave() { saveProfile(profile); setSaved(true); setTimeout(() => setSaved(false), 2000) }

  function handleFishSave() {
    handleSave()
    setFishEditOpen(false)
  }

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
    if (!newEmail)             { setEmailError('Email cannot be empty.'); return }
    if (newEmail !== confirmEmail) { setEmailError("Emails don't match."); return }
    const result = changeEmail(session.username, emailPassword, newEmail)
    if (!result.ok) { setEmailError(result.error); return }
    setEmailStep(3); setEmailPassword(''); setNewEmail(''); setConfirmEmail(''); setEmailError('')
  }

  const fish = profile.fish || {}

  return (
    <div className="profile-page">
      <BubbleBackground count={12} />

      <button className="join-back" onClick={() => navigate('/')}>← Back</button>
      <div className="profile-container">

        {/* ── Fish avatar header ── */}
        <div className="profile-fish-header">
          <div className="profile-fish-avatar" onClick={() => setFishEditOpen(true)}
            title="Click to edit your fish">
            <FishPreview styleId={fish.styleId} width={160} height={90} />
            <div className="fish-edit-overlay">
              <span className="fish-edit-icon">✏️</span>
              <span className="fish-edit-label">Edit Fish</span>
            </div>
          </div>
          <div className="profile-fish-info">
            <p className="profile-fish-username">@{session?.username || '—'}</p>
            <p className="profile-fish-nick">{profile.name || <em style={{ opacity: 0.5 }}>No nickname</em>}</p>
          </div>
        </div>

        {/* ── Account ── */}
        <div className="profile-card">
          <h1 className="join-title profile-card-title">Account</h1>
          <p className="join-desc profile-card-desc">Manage your login credentials.</p>

          <div className="profile-field">
            <span>Username <span className="field-note">(your unique login ID — not your email)</span></span>
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
            <span>Email <span className="field-note">(for account recovery — not used to log in)</span></span>
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
                  <button className="glass-btn" onClick={() => {
                    setEmailStep(0); setEmailError(''); setEmailPassword('')
                  }}>Cancel</button>
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

        {/* ── Identity ── */}
        <div className="profile-card">
          <h2 className="join-title profile-card-title">Identity</h2>
          <p className="join-desc profile-card-desc">How others see you.</p>
          <label className="profile-field">
            <span>Nickname <span className="field-note">(display name — easy to change)</span></span>
            <input className="profile-input" value={profile.name}
              onChange={e => updateField('name', e.target.value)} placeholder="Your display name" />
          </label>
          <label className="profile-field">
            <span>Bio</span>
            <textarea className="profile-input profile-textarea" value={profile.bio}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Builder, hacker, fish enthusiast..." rows={3} />
          </label>
        </div>

        {/* ── Interests ── */}
        <div className="profile-card">
          <h2 className="join-title profile-card-title">Interests</h2>
          <p className="join-desc profile-card-desc">Tags that describe what you build, study, or care about.</p>
          <TagInput value={profile.interests} onChange={tags => updateField('interests', tags)} placeholder="ai, design, climate..." />
        </div>

        {/* ── Looking For ── */}
        <div className="profile-card">
          <h2 className="join-title profile-card-title">Looking For</h2>
          <p className="join-desc profile-card-desc">What kind of people you want to meet.</p>
          <TagInput value={profile.goals} onChange={tags => updateField('goals', tags)} placeholder="cofounder, internship, mentor..." />
        </div>

        {/* ── Network ── */}
        <div className="profile-card">
          <h2 className="join-title profile-card-title">Network</h2>
          <p className="join-desc profile-card-desc">Tap people you already know.</p>
          <div className="connection-grid">
            {MOCK_PROFILES.map(p => {
              const isOn = (profile.connections || []).includes(p.id)
              return (
                <button key={p.id} type="button"
                  className={`connection-pill${isOn ? ' on' : ''}`}
                  onClick={() => toggleConnection(p.id)}>
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Socials ── */}
        <div className="profile-card">
          <h2 className="join-title profile-card-title">Socials</h2>
          <p className="join-desc profile-card-desc">Paste in your profile URLs.</p>
          {SOCIALS.map(s => (
            <label key={s.key} className="profile-field">
              <span>{s.label}</span>
              <input className="profile-input" value={profile.socials[s.key] || ''}
                onChange={e => updateSocial(s.key, e.target.value)} placeholder={s.placeholder} />
            </label>
          ))}
        </div>

        {/* ── Other Links ── */}
        <div className="profile-card">
          <h2 className="join-title profile-card-title">Other Links</h2>
          <p className="join-desc profile-card-desc">Portfolio, blog, anything else.</p>
          {profile.customLinks.map((link, idx) => (
            <div key={idx} className="profile-custom-row">
              <input className="profile-input profile-custom-label" value={link.label}
                onChange={e => updateCustomLink(idx, 'label', e.target.value)} placeholder="Label" />
              <input className="profile-input profile-custom-url" value={link.url}
                onChange={e => updateCustomLink(idx, 'url', e.target.value)} placeholder="https://..." />
              <button type="button" className="profile-remove-btn"
                onClick={() => removeCustomLink(idx)} aria-label="Remove">×</button>
            </div>
          ))}
          <button type="button" className="join-btn-create" onClick={addCustomLink}>+ Add a link</button>
        </div>

        <button className="join-btn-primary profile-save" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Profile'}
        </button>

      </div>

      {fishEditOpen && (
        <FishEditModal
          fish={fish}
          updateFish={updateFish}
          onSave={handleFishSave}
          onClose={() => setFishEditOpen(false)}
        />
      )}
    </div>
  )
}
