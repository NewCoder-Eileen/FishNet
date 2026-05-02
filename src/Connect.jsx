import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import BubbleBackground from './components/BubbleBackground'
import { getSession, subscribeAccounts } from './lib/auth'
import { subscribeProfiles } from './lib/profile'
import {
  subscribeAllConnections,
  sendConnectionRequest,
  acceptConnection,
  cancelConnection,
  declineConnection,
} from './lib/chat'
import './App.css'

// Build a friend-card data object from a username + cached accounts/profiles maps.
function buildCard(username, accounts, profiles) {
  const acc = accounts[username]
  if (!acc) return null
  const profile = profiles[username] || {}
  const displayName = profile.name?.trim() || acc.username
  const interests   = profile.interests || []
  const goals       = profile.goals || []
  const description = profile.bio?.trim()
    || (interests.length ? interests.slice(0, 3).join(' · ') : 'New to FishNet')
  return {
    username:        acc.username,
    email:           acc.email || '',
    displayName,
    description,
    interests,
    goals,
    socials:         profile.socials || {},
    customLinks:     profile.customLinks || [],
    spotifyPlaylist: profile.spotifyPlaylist || '',
    resumeLink:      profile.resume || '',
  }
}

// Stable hash → number in [0, 1)
function hash01(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return ((h >>> 0) % 100000) / 100000
}

// Same key encoding used by lib/auth.js, lib/profile.js, lib/relations.js,
// and EventPage broadcasts.
function encodeKey(k) {
  return (k || '').toLowerCase().replace(/[.#$[\]/]/g, '_')
}

// Best-effort: turn an encoded profile key back into something readable when
// no profile.name and no /accounts entry are available. Replaces `_` between
// alphanumerics with a `.` only when the key looks like an email.
function prettifyKey(k) {
  if (!k) return ''
  return k.includes('@') ? k.replace(/_/g, '.') : k
}

// ── Page ───────────────────────────────────────────────────────────
function Connect() {
  const session    = getSession()
  const myUsername = session?.username || ''
  const navigate   = useNavigate()
  const visitBowl  = (u) => navigate(`/user/${encodeKey(u)}`)

  // Live state mirrored from Firebase.
  const [accountsMap, setAccountsMap] = useState({})  // { keyEncoded: { username, password, email } }
  const [profilesMap, setProfilesMap] = useState({})  // { keyEncoded: profile }
  const [myRelations, setMyRelations] = useState({})  // { otherKeyEncoded: status }

  const [selectedFriend, setSelected] = useState(null)
  const [toasts, setToasts]           = useState([])
  const timeoutsRef                    = useRef([])

  useEffect(() => {
    const offA = subscribeAccounts(setAccountsMap)
    const offP = subscribeProfiles(setProfilesMap)
    return () => { offA?.(); offP?.() }
  }, [])

  useEffect(() => {
    if (!myUsername) { setMyRelations({}); return }
    const off = subscribeAllConnections(setMyRelations)
    return () => off?.()
  }, [myUsername])

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  // The canonical list of users is /profiles — every user who has ever signed
  // up, joined an event, or saved a profile is here. /accounts only covers
  // sign-ups since the migration, so it'd miss event-only users. We iterate
  // profile keys and enrich with account email when we have it.
  const accountByEncKey = useMemo(() => {
    const out = {}
    for (const [encKey, acc] of Object.entries(accountsMap)) {
      out[encKey] = acc
    }
    return out
  }, [accountsMap])

  const myEncKey = encodeKey(myUsername)
  const myProfile = profilesMap[myEncKey]
  const myTags = useMemo(() => {
    const set = new Set()
    ;(myProfile?.interests || []).forEach(t => t && set.add(t.toLowerCase()))
    ;(myProfile?.goals     || []).forEach(t => t && set.add(t.toLowerCase()))
    return set
  }, [myProfile])

  const bubbles = useMemo(() => {
    return Object.entries(profilesMap)
      .filter(([encKey]) => encKey !== myEncKey)
      .map(([encKey, profile]) => {
        const acc       = accountByEncKey[encKey] || null
        // Identity used for display + relation actions. Prefer the original
        // username from /accounts (correct casing), fall back to a prettified
        // version of the encoded key for event-only users.
        const username  = acc?.username || prettifyKey(encKey)
        const displayName = profile?.name?.trim() || username
        const interests = profile?.interests || []
        const goals     = profile?.goals || []
        const description = profile?.bio?.trim()
          || (interests.length ? interests.slice(0, 3).join(' · ') : 'New to FishNet')
        const card = {
          username,
          email:           acc?.email || '',
          displayName,
          description,
          interests,
          goals,
          socials:         profile?.socials || {},
          customLinks:     profile?.customLinks || [],
          spotifyPlaylist: profile?.spotifyPlaylist || '',
          resumeLink:      profile?.resume || '',
        }
        const merged = [...interests, ...goals]
        const seen   = new Set()
        const shared = []
        for (const t of merged) {
          const k = (t || '').toLowerCase()
          if (!k || seen.has(k)) continue
          if (myTags.has(k)) { shared.push(t); seen.add(k) }
        }
        return { card, shared, status: myRelations[encKey]?.status, encKey }
      })
      .filter(b => b.status !== 'accepted')
      .sort((a, b) => {
        const aIn = a.status === 'received' ? 1 : 0
        const bIn = b.status === 'received' ? 1 : 0
        if (aIn !== bIn) return bIn - aIn
        if (a.shared.length !== b.shared.length) return b.shared.length - a.shared.length
        return a.card.displayName.localeCompare(b.card.displayName)
      })
  }, [profilesMap, accountByEncKey, myRelations, myEncKey, myTags])

  const labelOf = (u) => {
    const enc = encodeKey(u)
    return profilesMap[enc]?.name?.trim() || accountByEncKey[enc]?.username || u
  }

  function pushToast(text, kind = 'info') {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, kind }])
    const tid = setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    timeoutsRef.current.push(tid)
  }

  function sendRequest(target) {
    if (!myUsername || !target || target === myUsername) return
    const enc = encodeKey(target)
    if (myRelations[enc]) return
    try {
      sendConnectionRequest(enc, labelOf(target))
      pushToast(`Friend request sent to ${labelOf(target)}`, 'info')
    } catch (e) {
      console.error(e)
      pushToast('Could not send request — try again.', 'error')
    }
  }

  function cancelRequest(target) {
    try {
      cancelConnection(encodeKey(target))
      pushToast(`Cancelled request to ${labelOf(target)}`, 'info')
    } catch (e) { console.error(e) }
  }

  function acceptRequest(target) {
    try {
      acceptConnection(encodeKey(target))
      pushToast(`You and ${labelOf(target)} are now friends`, 'success')
    } catch (e) { console.error(e) }
  }

  function declineRequest(target) {
    try {
      declineConnection(encodeKey(target))
      pushToast(`Declined request from ${labelOf(target)}`, 'info')
    } catch (e) { console.error(e) }
  }

  function messageFriend(target) {
    // Open the Messages page with this user's chat preselected. Messages.jsx
    // reads ?user= as the encoded key and ?name= as the display name.
    const enc  = encodeKey(target)
    const name = labelOf(target)
    navigate(`/messages?user=${enc}&name=${encodeURIComponent(name)}`)
  }

  function PersonBubble({ card, shared, status }) {
    const seed   = hash01(card.username)
    const dur    = 4.2 + seed * 2.8
    const delay  = -(seed * 6)
    const driftX = (seed * 14 - 7).toFixed(1)
    const driftY = ((1 - seed) * 12 - 6).toFixed(1)
    const tilt   = (seed * 6 - 3).toFixed(1)

    function onAdd(e) {
      e.stopPropagation()
      if (status === 'sent') cancelRequest(card.username)
      else                          sendRequest(card.username)
    }

    return (
      <div
        className={`person-bubble${status === 'received' ? ' incoming' : ''}${status === 'sent' ? ' sent' : ''}`}
        style={{
          animationDuration: `${dur}s`,
          animationDelay: `${delay}s`,
          '--bubble-dx': `${driftX}px`,
          '--bubble-dy': `${driftY}px`,
          '--bubble-tilt': `${tilt}deg`,
        }}
        onClick={() => setSelected(card)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelected(card) }}
      >
        <span className="bubble-shine" aria-hidden />
        <span className="bubble-shine-sm" aria-hidden />

        <div className="bubble-inner">
          <div className="bubble-avatar">{card.displayName.charAt(0).toUpperCase()}</div>
          <div className="bubble-name">{card.displayName}</div>

          {shared.length > 0 && (
            <div className="bubble-tags">
              {shared.slice(0, 3).map(t => (
                <span key={t} className="bubble-tag">{t}</span>
              ))}
              {shared.length > 3 && (
                <span className="bubble-tag more">+{shared.length - 3}</span>
              )}
            </div>
          )}

          {status === 'received' && <span className="bubble-status">wants to connect</span>}
        </div>

        {status === 'received' ? (
          <div className="bubble-accept-row" onClick={(e) => e.stopPropagation()}>
            <button className="bubble-mini accept" onClick={() => acceptRequest(card.username)} aria-label="Accept">✓</button>
            <button className="bubble-mini decline" onClick={() => declineRequest(card.username)} aria-label="Decline">×</button>
          </div>
        ) : (
          <button
            className={`bubble-add${status === 'sent' ? ' sent' : ''}`}
            onClick={onAdd}
            aria-label={status === 'sent' ? 'Cancel request' : 'Send connect request'}
            title={status === 'sent' ? 'Sent — click to cancel' : 'Connect'}
          >
            {status === 'sent' ? '✓' : '+'}
          </button>
        )}
      </div>
    )
  }

  if (!myUsername) {
    return (
      <>
        <BubbleBackground count={16} />
        <Navbar />
        <main>
          <section className="connect-section">
            <div className="connect-empty">
              <h2>Connect</h2>
              <p>Sign in to find people on FishNet.</p>
            </div>
          </section>
        </main>
      </>
    )
  }

  const incomingCount = bubbles.filter(b => b.status === 'received').length

  return (
    <>
      <BubbleBackground count={16} />
      <Navbar />

      <div className="toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div key={t.id} className={`toast-item toast-${t.kind}`}>{t.text}</div>
        ))}
      </div>

      <main>
        <section className="connect-section">
          <div className="connect-tank-wrap">
            <header className="tank-header">
              <h2>The Pod</h2>
              <p>
                Everyone on FishNet, floating around. Tap{' '}
                <span className="inline-plus" aria-hidden>+</span> to send a connect request.
              </p>
              {incomingCount > 0 && (
                <p className="tank-hint incoming">
                  {incomingCount} {incomingCount === 1 ? 'person wants' : 'people want'} to connect — pink bubbles.
                </p>
              )}
            </header>

            <div className="bubble-tank">
              {bubbles.length === 0 ? (
                <div className="tank-empty">
                  Nobody else here yet. New FishNet members will bubble up as they join.
                </div>
              ) : (
                bubbles.map(b => (
                  <PersonBubble key={b.card.username} card={b.card} shared={b.shared} status={b.status} />
                ))
              )}
            </div>
          </div>

          {selectedFriend && (
            <div className="profile-modal-overlay" onClick={() => setSelected(null)}>
              <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal glass-btn" onClick={() => setSelected(null)}>×</button>
                <div className="modal-header">
                  <h2>{selectedFriend.displayName}</h2>
                  <p className="modal-subtitle">@{selectedFriend.username}</p>
                </div>
                <div className="profile-details">
                  {selectedFriend.email && <p><strong>Email:</strong> {selectedFriend.email}</p>}
                  {selectedFriend.interests.length > 0 && (
                    <p><strong>Interests:</strong> {selectedFriend.interests.join(', ')}</p>
                  )}
                  {selectedFriend.goals.length > 0 && (
                    <p><strong>Looking for:</strong> {selectedFriend.goals.join(', ')}</p>
                  )}
                  {selectedFriend.spotifyPlaylist && (
                    <p>
                      <strong>Spotify Playlist:</strong>{' '}
                      <a href={selectedFriend.spotifyPlaylist} target="_blank" rel="noreferrer" className="link">
                        {selectedFriend.spotifyPlaylist}
                      </a>
                    </p>
                  )}
                  {Object.values(selectedFriend.socials).some(Boolean) && (
                    <>
                      <p><strong>Socials:</strong></p>
                      <ul>
                        {Object.entries(selectedFriend.socials)
                          .filter(([, v]) => v)
                          .map(([k, v]) => (
                            <li key={k}>
                              <a href={typeof v === 'string' && v.startsWith('http') ? v : `mailto:${v}`}
                                 target="_blank" rel="noreferrer" className="link">{k}: {v}</a>
                            </li>
                          ))}
                      </ul>
                    </>
                  )}
                  {selectedFriend.resumeLink && (
                    <p>
                      <strong>Resume:</strong>{' '}
                      <a href={selectedFriend.resumeLink} target="_blank" rel="noreferrer" className="link">
                        {selectedFriend.resumeLink}
                      </a>
                    </p>
                  )}
                </div>
                <div className="modal-actions">
                  <button className="glass-btn" onClick={() => visitBowl(selectedFriend.username)}>Visit Bowl</button>
                  {(() => {
                    const status = myRelations[encodeKey(selectedFriend.username)]?.status
                    if (status === 'accepted')    return <span className="added-pill">Friends ✓</span>
                    if (status === 'sent') return <button className="glass-btn"         onClick={() => cancelRequest(selectedFriend.username)}>Cancel request</button>
                    if (status === 'received')  return (
                      <>
                        <button className="glass-btn primary" onClick={() => acceptRequest(selectedFriend.username)}>Accept</button>
                        <button className="glass-btn"         onClick={() => declineRequest(selectedFriend.username)}>Decline</button>
                      </>
                    )
                    return <button className="glass-btn primary" onClick={() => sendRequest(selectedFriend.username)}>Connect</button>
                  })()}
                  <button className="glass-btn" onClick={() => messageFriend(selectedFriend.username)}>Message</button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  )
}

export default Connect
