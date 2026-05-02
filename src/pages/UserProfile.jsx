import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ref, onValue } from 'firebase/database'
import { db } from '../lib/firebase'
import { loadProfile } from '../lib/profile'
import { isLoggedIn } from '../lib/auth'
import { getStyle } from '../aquarium/fishStyles'
import { BowlFish, FishPreview } from '../components/BowlFish'
import {
  myUserId, getDmId,
  sendDm, markDmRead, subscribeDmMessages,
  sendConnectionRequest, acceptConnection, subscribeConnection,
} from '../lib/chat'
import seaweedA from '../assets/seaweed-a.png'
import seaweedB from '../assets/seaweed-b.png'
import '../App.css'

function fmt(ts) {
  if (!ts) return ''
  const d = new Date(ts), now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function UserProfile() {
  const { username } = useParams()
  const navigate     = useNavigate()
  const location     = useLocation()

  const seed = location.state?.user || {}
  const [profile, setProfile] = useState({
    name:        seed.name        || '',
    bio:         seed.bio         || '',
    interests:   seed.interests   || [],
    goals:       seed.goals       || [],
    socials:     seed.socials     || {},
    customLinks: seed.customLinks || [],
    fish:        seed.fish        || {},
  })
  const [loading,     setLoading]     = useState(true)
  const [activePanel, setActivePanel] = useState(null)

  // DM drawer
  const [dmOpen,     setDmOpen]     = useState(false)
  const [dmMessages, setDmMessages] = useState([])
  const [dmText,     setDmText]     = useState('')
  const dmBottomRef = useRef(null)
  const dmInputRef  = useRef(null)

  // Connection status
  const [connStatus, setConnStatus] = useState(null)

  const me    = myUserId()
  const dmId  = me ? getDmId(me, username) : null
  const isSelf = me === username

  // Load viewer's own fish style
  const myProfile  = loadProfile()
  const myStyle    = getStyle(myProfile.fish?.styleId)
  const theirStyle = getStyle(profile.fish?.styleId)

  // Load their Firebase profile
  useEffect(() => {
    const profileRef = ref(db, `profiles/${username}`)
    const unsub = onValue(profileRef, snap => {
      const data = snap.val()
      if (data) setProfile(p => ({ ...p, ...data }))
      setLoading(false)
    })
    return () => unsub()
  }, [username])

  // Connection status
  useEffect(() => {
    if (!isLoggedIn() || isSelf) return
    return subscribeConnection(username, setConnStatus)
  }, [username, isSelf])

  // DM messages when drawer is open
  useEffect(() => {
    if (!dmOpen || !dmId) return
    markDmRead(dmId)
    return subscribeDmMessages(dmId, setDmMessages)
  }, [dmOpen, dmId])

  // Scroll DM to bottom on new messages
  useEffect(() => {
    if (dmOpen) dmBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [dmMessages, dmOpen])

  function openDm() {
    if (!isLoggedIn()) { navigate('/login'); return }
    setDmOpen(true)
    setTimeout(() => dmInputRef.current?.focus(), 80)
  }

  function handleDmSend() {
    if (!dmText.trim() || !me) return
    sendDm(username, profile.name || username, dmText)
    setDmText('')
    dmInputRef.current?.focus()
  }

  function handleConnect() {
    if (!isLoggedIn()) { navigate('/login'); return }
    if (!connStatus) {
      sendConnectionRequest(username, profile.name || username)
    } else if (connStatus.status === 'received') {
      acceptConnection(username)
    }
  }

  const connectLabel = () => {
    if (!connStatus)                    return 'Add Friend'
    if (connStatus.status === 'sent')   return 'Request Sent'
    if (connStatus.status === 'received') return 'Accept Request'
    if (connStatus.status === 'accepted') return 'Connected ✓'
    return 'Add Friend'
  }

  const connectDisabled = connStatus?.status === 'sent' || connStatus?.status === 'accepted'

  // Info dots
  const DOTS = [
    { id: 'interests', label: 'Interests',   color: 'green', xPct: 0.50, yPct: 0.86 },
    { id: 'goals',     label: 'Looking For', color: 'blue',  xPct: 0.20, yPct: 0.78 },
    { id: 'contact',   label: 'Contact',     color: 'blue',  xPct: 0.80, yPct: 0.78 },
  ]

  return (
    <div className="profile-fishbowl-page">
      <button className="join-back" onClick={() => navigate(-1)}>← Back</button>

      <div className="profile-fishbowl">
        <div className="profile-fishbowl-water" />
        <div className="fishbowl-shine" aria-hidden />
        <div className="fishbowl-water-line" aria-hidden />

        <BowlFish
          styleId={myStyle.id}
          dots={DOTS}
          onDotEnter={id => setActivePanel(p => p === id ? null : id)}
        />

        {/* Their identity card */}
        <div className="bowl-id-card">
          <div className="bowl-fish-square">
            <FishPreview styleId={theirStyle.id} width={84} height={84} />
          </div>
          <div className="bowl-id-text">
            <div className="bowl-username-row">
              <p className="bowl-username">@{username}</p>
            </div>
            {profile.name && <p className="bowl-display-name">{profile.name}</p>}
            <div className="bowl-contact-row">
              {profile.socials?.email    && <a className="bowl-contact-chip" href={`mailto:${profile.socials.email}`}>Email</a>}
              {profile.socials?.github   && <a className="bowl-contact-chip" href={profile.socials.github}   target="_blank" rel="noreferrer">GitHub</a>}
              {profile.socials?.linkedin && <a className="bowl-contact-chip" href={profile.socials.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>}
              {profile.socials?.twitter  && <a className="bowl-contact-chip" href={profile.socials.twitter}  target="_blank" rel="noreferrer">Twitter</a>}
              {profile.socials?.devpost  && <a className="bowl-contact-chip" href={profile.socials.devpost}  target="_blank" rel="noreferrer">Devpost</a>}
              {profile.socials?.website  && <a className="bowl-contact-chip" href={profile.socials.website}  target="_blank" rel="noreferrer">Site</a>}
            </div>
          </div>
        </div>

        {/* Seaweed */}
        <img src={seaweedA} alt="" className="bowl-seaweed seaweed-left"  aria-hidden />
        <img src={seaweedB} alt="" className="bowl-seaweed seaweed-mid"   aria-hidden />
        <img src={seaweedA} alt="" className="bowl-seaweed seaweed-right" aria-hidden />

        {/* Sand + rocks */}
        <div className="bowl-sand" aria-hidden />
        <div className="bowl-rocks" aria-hidden>
          <span className="rock rock-1" /><span className="rock rock-2" />
          <span className="rock rock-3" /><span className="rock rock-4" />
          <span className="rock rock-5" />
        </div>

        {/* Info dots */}
        {DOTS.map(d => (
          <button
            key={d.id}
            className={`bowl-dot bowl-dot-${d.color}`}
            style={{ left: `${d.xPct * 100}%`, top: `${d.yPct * 100}%` }}
            onClick={() => setActivePanel(p => p === d.id ? null : d.id)}
            aria-label={d.label}
            title={d.label}
          >
            <span className="bowl-dot-tooltip">{d.label}</span>
          </button>
        ))}

        {/* Read-only info panels */}
        {activePanel === 'interests' && profile.interests?.length > 0 && (
          <div className="bowl-info-panel">
            <button className="bowl-info-close" onClick={() => setActivePanel(null)}>×</button>
            <p className="bowl-info-title">Interests</p>
            <div className="tag-list">
              {profile.interests.map(t => <span key={t} className="tag-pill" style={{ cursor: 'default' }}>{t}</span>)}
            </div>
          </div>
        )}
        {activePanel === 'goals' && profile.goals?.length > 0 && (
          <div className="bowl-info-panel">
            <button className="bowl-info-close" onClick={() => setActivePanel(null)}>×</button>
            <p className="bowl-info-title">Looking For</p>
            <div className="tag-list">
              {profile.goals.map(t => <span key={t} className="tag-pill" style={{ cursor: 'default' }}>{t}</span>)}
            </div>
          </div>
        )}
        {activePanel === 'contact' && (
          <div className="bowl-info-panel">
            <button className="bowl-info-close" onClick={() => setActivePanel(null)}>×</button>
            <p className="bowl-info-title">Contact</p>
            {profile.bio && <p className="bowl-info-bio">{profile.bio}</p>}
            {profile.customLinks?.filter(l => l.url).map((l, i) => (
              <a key={i} href={l.url} target="_blank" rel="noreferrer" className="bowl-contact-chip" style={{ display: 'inline-block', marginTop: 6 }}>
                {l.label || l.url}
              </a>
            ))}
          </div>
        )}

        {/* Bottom toolbar */}
        {!isSelf && (
          <div className="bowl-toolbar">
            <button
              className={`up-connect-btn ${connStatus?.status === 'accepted' ? 'up-connected' : ''}`}
              onClick={handleConnect}
              disabled={connectDisabled}
            >
              {connectLabel()}
            </button>
            <button className="up-dm-btn" onClick={openDm}>
              Message
            </button>
          </div>
        )}

        {loading && <div className="bowl-saved-flash" style={{ background: 'rgba(100,150,255,0.15)' }}>Loading...</div>}
      </div>

      {/* ── DM Drawer ── */}
      <div className={`profile-dm-drawer ${dmOpen ? 'pdm-open' : ''}`}>
        <div className="pdm-header">
          <button className="pdm-back" onClick={() => setDmOpen(false)}>←</button>
          <div className="pdm-title-row">
            <div className="pdm-avatar">{(profile.name || username || '?')[0].toUpperCase()}</div>
            <span className="pdm-title">@{username}</span>
          </div>
          <button
            className="pdm-open-full"
            onClick={() => navigate(`/messages?user=${username}&name=${encodeURIComponent(profile.name || username)}`)}
            title="Open full messages"
          >
            ↗
          </button>
        </div>

        <div className="pdm-body">
          {dmMessages.length === 0 && (
            <p className="pdm-empty">Say hi! Start the conversation.</p>
          )}
          {dmMessages.map(msg => (
            <div key={msg.id} className={`msg-wrap ${msg.from === me ? 'msg-wrap-mine' : 'msg-wrap-theirs'}`}>
              <div className={`msg-bubble ${msg.from === me ? 'msg-bubble-mine' : 'msg-bubble-theirs'}`}>
                {msg.text}
              </div>
              <span className="msg-ts">{fmt(msg.ts)}</span>
            </div>
          ))}
          <div ref={dmBottomRef} />
        </div>

        <div className="pdm-input-row">
          <input
            ref={dmInputRef}
            className="pdm-input"
            value={dmText}
            onChange={e => setDmText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleDmSend() } }}
            placeholder={`Message @${username}…`}
            maxLength={500}
          />
          <button className="pdm-send" onClick={handleDmSend} disabled={!dmText.trim()}>↑</button>
        </div>
      </div>

      {/* Overlay backdrop for DM drawer on mobile */}
      {dmOpen && <div className="pdm-backdrop" onClick={() => setDmOpen(false)} />}
    </div>
  )
}
