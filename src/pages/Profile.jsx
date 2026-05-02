import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadProfile, saveProfile } from '../lib/profile'
import { MOCK_PROFILES } from '../data/mockProfiles'
import '../App.css'

const SOCIALS = [
  { key: 'github',   label: 'GitHub',        placeholder: 'https://github.com/yourusername' },
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

  function removeTag(idx) {
    onChange(tags.filter((_, i) => i !== idx))
  }

  return (
    <div className="tag-input">
      <div className="tag-list">
        {tags.map((tag, i) => (
          <button key={i} type="button" className="tag-pill" onClick={() => removeTag(i)}>
            {tag} <span className="tag-pill-x">×</span>
          </button>
        ))}
        <input
          className="tag-draft"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag()
            } else if (e.key === 'Backspace' && !draft && tags.length > 0) {
              onChange(tags.slice(0, -1))
            }
          }}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
        />
      </div>
      <span className="tag-hint">Press Enter or comma to add</span>
    </div>
  )
}

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(loadProfile)
  const [saved, setSaved] = useState(false)

  function updateField(field, value) {
    setProfile(p => ({ ...p, [field]: value }))
  }

  function updateSocial(key, value) {
    setProfile(p => ({ ...p, socials: { ...p.socials, [key]: value } }))
  }

  function toggleConnection(id) {
    setProfile(p => {
      const list = p.connections || []
      return {
        ...p,
        connections: list.includes(id) ? list.filter(x => x !== id) : [...list, id],
      }
    })
  }

  function addCustomLink() {
    setProfile(p => ({
      ...p,
      customLinks: [...p.customLinks, { label: '', url: '' }],
    }))
  }

  function updateCustomLink(idx, field, value) {
    setProfile(p => ({
      ...p,
      customLinks: p.customLinks.map((link, i) =>
        i === idx ? { ...link, [field]: value } : link
      ),
    }))
  }

  function removeCustomLink(idx) {
    setProfile(p => ({
      ...p,
      customLinks: p.customLinks.filter((_, i) => i !== idx),
    }))
  }

  function handleSave() {
    saveProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="profile-page">
      <button className="join-back" onClick={() => navigate('/')}>← Back</button>

      <div className="profile-container">

        <div className="profile-card">
          <h1 className="join-title profile-card-title">Your Profile</h1>
          <p className="join-desc profile-card-desc">Tell people who you are.</p>

          <label className="profile-field">
            <span>Display name</span>
            <input
              className="profile-input"
              value={profile.name}
              onChange={e => updateField('name', e.target.value)}
              placeholder="Your name"
            />
          </label>

          <label className="profile-field">
            <span>Bio</span>
            <textarea
              className="profile-input profile-textarea"
              value={profile.bio}
              onChange={e => updateField('bio', e.target.value)}
              placeholder="Builder, hacker, fish enthusiast..."
              rows={3}
            />
          </label>
        </div>

        <div className="profile-card">
          <h2 className="join-title profile-card-title">Interests</h2>
          <p className="join-desc profile-card-desc">Tags that describe what you build, study, or care about.</p>
          <TagInput
            value={profile.interests}
            onChange={tags => updateField('interests', tags)}
            placeholder="ai, design, climate..."
          />
        </div>

        <div className="profile-card">
          <h2 className="join-title profile-card-title">Looking For</h2>
          <p className="join-desc profile-card-desc">What kind of people you want to meet.</p>
          <TagInput
            value={profile.goals}
            onChange={tags => updateField('goals', tags)}
            placeholder="cofounder, internship, mentor..."
          />
        </div>

        <div className="profile-card">
          <h2 className="join-title profile-card-title">Network</h2>
          <p className="join-desc profile-card-desc">Tap people you already know — used to find mutual connections.</p>
          <div className="connection-grid">
            {MOCK_PROFILES.map(p => {
              const isOn = (profile.connections || []).includes(p.id)
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`connection-pill${isOn ? ' on' : ''}`}
                  onClick={() => toggleConnection(p.id)}
                >
                  {p.name}
                </button>
              )
            })}
          </div>
        </div>

        <div className="profile-card">
          <h2 className="join-title profile-card-title">Socials</h2>
          <p className="join-desc profile-card-desc">Paste in your profile URLs.</p>

          {SOCIALS.map(s => (
            <label key={s.key} className="profile-field">
              <span>{s.label}</span>
              <input
                className="profile-input"
                value={profile.socials[s.key] || ''}
                onChange={e => updateSocial(s.key, e.target.value)}
                placeholder={s.placeholder}
              />
            </label>
          ))}
        </div>

        <div className="profile-card">
          <h2 className="join-title profile-card-title">Other Links</h2>
          <p className="join-desc profile-card-desc">Portfolio, blog, anything else worth sharing.</p>

          {profile.customLinks.map((link, idx) => (
            <div key={idx} className="profile-custom-row">
              <input
                className="profile-input profile-custom-label"
                value={link.label}
                onChange={e => updateCustomLink(idx, 'label', e.target.value)}
                placeholder="Label"
              />
              <input
                className="profile-input profile-custom-url"
                value={link.url}
                onChange={e => updateCustomLink(idx, 'url', e.target.value)}
                placeholder="https://..."
              />
              <button
                type="button"
                className="profile-remove-btn"
                onClick={() => removeCustomLink(idx)}
                aria-label="Remove link"
              >
                ×
              </button>
            </div>
          ))}

          <button type="button" className="join-btn-create" onClick={addCustomLink}>
            + Add a link
          </button>
        </div>

        <button className="join-btn-primary profile-save" onClick={handleSave}>
          {saved ? '✓ Saved' : 'Save Profile'}
        </button>

      </div>
    </div>
  )
}
