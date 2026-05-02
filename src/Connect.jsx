import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import BubbleBackground from './components/BubbleBackground'
import { getSession } from './lib/auth'
import './App.css'

const ACCOUNTS_KEY = 'fishnet_accounts'

// ── Storage helpers ────────────────────────────────────────────────
function loadAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}') } catch { return {} }
}

function loadProfileFor(username) {
  if (!username) return null
  try { return JSON.parse(localStorage.getItem(`fishnet_profile_${username}`) || 'null') } catch { return null }
}

function relationsKey(username) { return `fishnet_connect_${username}` }

function loadRelations(username) {
  if (!username) return {}
  try { return JSON.parse(localStorage.getItem(relationsKey(username)) || '{}') } catch { return {} }
}

function saveRelations(username, rel) {
  if (!username) return
  localStorage.setItem(relationsKey(username), JSON.stringify(rel))
}

function patchRelationsFor(otherUsername, patch) {
  const cur = loadRelations(otherUsername)
  saveRelations(otherUsername, { ...cur, ...patch })
}

function clearRelationFor(otherUsername, removeKey) {
  const cur = loadRelations(otherUsername)
  delete cur[removeKey]
  saveRelations(otherUsername, cur)
}

function buildCard(username) {
  const accounts = loadAccounts()
  const acc = accounts[username]
  if (!acc) return null
  const profile = loadProfileFor(username) || {}
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

// ── Page ───────────────────────────────────────────────────────────
function Connect() {
  const session    = getSession()
  const myUsername = session?.username || ''

  const [accounts,  setAccounts]      = useState(loadAccounts)
  const [relations, setRelations]     = useState(() => loadRelations(myUsername))
  const [myProfile, setMyProfile]     = useState(() => loadProfileFor(myUsername))
  const [selectedFriend, setSelected] = useState(null)
  const [toasts, setToasts]           = useState([])
  const timeoutsRef                    = useRef([])

  useEffect(() => {
    function refresh() {
      setAccounts(loadAccounts())
      setRelations(loadRelations(myUsername))
      setMyProfile(loadProfileFor(myUsername))
    }
    const id = setInterval(refresh, 1500)
    window.addEventListener('storage', refresh)
    return () => { clearInterval(id); window.removeEventListener('storage', refresh) }
  }, [myUsername])

  useEffect(() => {
    if (!myUsername) return
    saveRelations(myUsername, relations)
  }, [relations, myUsername])

  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const myTags = useMemo(() => {
    const set = new Set()
    ;(myProfile?.interests || []).forEach(t => t && set.add(t.toLowerCase()))
    ;(myProfile?.goals     || []).forEach(t => t && set.add(t.toLowerCase()))
    return set
  }, [myProfile])

  const bubbles = useMemo(() => {
    return Object.values(accounts)
      .filter(acc => acc.username !== myUsername)
      .map(acc => {
        const card = buildCard(acc.username)
        if (!card) return null
        const merged = [...(card.interests || []), ...(card.goals || [])]
        const seen   = new Set()
        const shared = []
        for (const t of merged) {
          const key = (t || '').toLowerCase()
          if (!key || seen.has(key)) continue
          if (myTags.has(key)) { shared.push(t); seen.add(key) }
        }
        return { card, shared, status: relations[card.username] }
      })
      .filter(Boolean)
      .filter(b => b.status !== 'friend')
      .sort((a, b) => {
        // Incoming requests bubble to the top, then most shared tags first,
        // then alphabetical by display name so the order is stable.
        const aIn = a.status === 'pending_in' ? 1 : 0
        const bIn = b.status === 'pending_in' ? 1 : 0
        if (aIn !== bIn) return bIn - aIn
        if (a.shared.length !== b.shared.length) return b.shared.length - a.shared.length
        return a.card.displayName.localeCompare(b.card.displayName)
      })
  }, [accounts, relations, myUsername, myTags])

  const labelOf = (u) => buildCard(u)?.displayName || u

  function pushToast(text, kind = 'info') {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, kind }])
    const tid = setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    timeoutsRef.current.push(tid)
  }

  function sendRequest(target) {
    if (!myUsername || !target || target === myUsername || relations[target]) return
    setRelations(r => ({ ...r, [target]: 'pending_out' }))
    patchRelationsFor(target, { [myUsername]: 'pending_in' })
    pushToast(`Friend request sent to ${labelOf(target)}`, 'info')
  }

  function cancelRequest(target) {
    setRelations(r => { const n = { ...r }; delete n[target]; return n })
    clearRelationFor(target, myUsername)
    pushToast(`Cancelled request to ${labelOf(target)}`, 'info')
  }

  function acceptRequest(target) {
    setRelations(r => ({ ...r, [target]: 'friend' }))
    patchRelationsFor(target, { [myUsername]: 'friend' })
    pushToast(`You and ${labelOf(target)} are now friends`, 'success')
  }

  function declineRequest(target) {
    setRelations(r => { const n = { ...r }; delete n[target]; return n })
    clearRelationFor(target, myUsername)
    pushToast(`Declined request from ${labelOf(target)}`, 'info')
  }

  function messageFriend(target) {
    pushToast(`Messaging ${labelOf(target)}… (coming soon)`, 'info')
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
      if (status === 'pending_out') cancelRequest(card.username)
      else                          sendRequest(card.username)
    }

    return (
      <div
        className={`person-bubble${status === 'pending_in' ? ' incoming' : ''}${status === 'pending_out' ? ' sent' : ''}`}
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

          {status === 'pending_in' && <span className="bubble-status">wants to connect</span>}
        </div>

        {status === 'pending_in' ? (
          <div className="bubble-accept-row" onClick={(e) => e.stopPropagation()}>
            <button className="bubble-mini accept" onClick={() => acceptRequest(card.username)} aria-label="Accept">✓</button>
            <button className="bubble-mini decline" onClick={() => declineRequest(card.username)} aria-label="Decline">×</button>
          </div>
        ) : (
          <button
            className={`bubble-add${status === 'pending_out' ? ' sent' : ''}`}
            onClick={onAdd}
            aria-label={status === 'pending_out' ? 'Cancel request' : 'Send connect request'}
            title={status === 'pending_out' ? 'Sent — click to cancel' : 'Connect'}
          >
            {status === 'pending_out' ? '✓' : '+'}
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

  const incomingCount = bubbles.filter(b => b.status === 'pending_in').length

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
                  {(() => {
                    const status = relations[selectedFriend.username]
                    if (status === 'friend')      return <span className="added-pill">Friends ✓</span>
                    if (status === 'pending_out') return <button className="glass-btn"         onClick={() => cancelRequest(selectedFriend.username)}>Cancel request</button>
                    if (status === 'pending_in')  return (
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
