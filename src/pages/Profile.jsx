import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

const SOCIALS = [
  { key: 'github',   label: 'GitHub',        placeholder: 'https://github.com/yourusername' },
  { key: 'linkedin', label: 'LinkedIn',      placeholder: 'https://linkedin.com/in/yourusername' },
  { key: 'twitter',  label: 'Twitter / X',   placeholder: 'https://x.com/yourusername' },
  { key: 'devpost',  label: 'Devpost',       placeholder: 'https://devpost.com/yourusername' },
  { key: 'website',  label: 'Personal Site', placeholder: 'https://yourname.com' },
  { key: 'email',    label: 'Email',         placeholder: 'you@example.com' },
]

const EMPTY_PROFILE = {
  name: '',
  bio: '',
  socials: {},
  customLinks: [],
}

function loadProfile() {
  try {
    const stored = JSON.parse(localStorage.getItem('fishnet_profile') || 'null')
    return { ...EMPTY_PROFILE, ...(stored || {}) }
  } catch {
    return EMPTY_PROFILE
  }
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
    localStorage.setItem('fishnet_profile', JSON.stringify(profile))
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
