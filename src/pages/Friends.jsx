import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BubbleBackground from '../components/BubbleBackground'
import { getSession, subscribeAccounts } from '../lib/auth'
import { subscribeProfiles } from '../lib/profile'
import {
  myUserId,
  subscribeAllConnections,
  sendConnectionRequest,
  acceptConnection,
  cancelConnection,
  declineConnection,
  removeConnection,
  getDmId,
  sendDm,
  subscribeDmMessages,
  markDmRead,
} from '../lib/chat'
import '../App.css'

function encodeKey(k) {
  return (k || '').toLowerCase().replace(/[.#$[\]/]/g, '_')
}

function prettifyKey(k) {
  if (!k) return ''
  return k.includes('@') ? k.replace(/_/g, '.') : k
}

function buildCard(encKey, accountsMap, profilesMap) {
  const acc       = accountsMap[encKey] || null
  const profile   = profilesMap[encKey] || {}
  const username  = acc?.username || prettifyKey(encKey)
  const displayName = profile?.name?.trim() || username
  const interests = profile?.interests || []
  const goals     = profile?.goals || []
  const description = profile?.bio?.trim()
    || (interests.length ? interests.slice(0, 3).join(' · ') : 'New to FishNet')
  return {
    encKey,
    username,
    email:           acc?.email || '',
    displayName,
    description,
    interests,
    goals,
    socials:         profile?.socials || {},
    spotifyPlaylist: profile?.spotifyPlaylist || '',
    resumeLink:      profile?.resume || '',
  }
}

// ── Chat modal ─────────────────────────────────────────────────────
function ChatModal({ me, partner, onClose }) {
  const [messages, setMessages] = useState([])
  const [draft, setDraft]       = useState('')
  const [sending, setSending]   = useState(false)
  const scrollRef = useRef(null)

  const dmId = me && partner?.encKey ? getDmId(me, partner.encKey) : null

  useEffect(() => {
    if (!dmId) return
    markDmRead(dmId)
    const off = subscribeDmMessages(dmId, setMessages)
    return () => off?.()
  }, [dmId])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  async function handleSend(e) {
    e?.preventDefault?.()
    const text = draft.trim()
    if (!text || sending) return
    setSending(true)
    setDraft('')
    try {
      await sendDm(partner.encKey, partner.displayName, text)
    } catch (err) {
      console.error(err)
      setDraft(text)
    } finally {
      setSending(false)
    }
  }

  function fmtTime(ts) {
    if (!ts) return ''
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch { return '' }
  }

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal chat-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-modal glass-btn" onClick={onClose} aria-label="Close">×</button>
        <div className="modal-header">
          <h2>{partner.displayName}</h2>
          <p className="modal-subtitle">@{partner.username}</p>
        </div>

        <div className="chat-scroll" ref={scrollRef}>
          {messages.length === 0
            ? <p className="chat-empty">Say hi to {partner.displayName.split(' ')[0]} 👋</p>
            : messages.map(m => (
              <div key={m.id} className={`chat-msg ${m.from === me ? 'mine' : 'theirs'}`}>
                <div className="chat-bubble">{m.text}</div>
                <span className="chat-time">{fmtTime(m.ts)}</span>
              </div>
            ))}
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            className="profile-input chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Message ${partner.displayName.split(' ')[0]}…`}
            autoFocus
          />
          <button className="join-btn-primary chat-send" type="submit" disabled={!draft.trim() || sending}>
            Send
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────
export default function Friends() {
  const session    = getSession()
  const myUsername = session?.username || ''
  const myEncKey   = encodeKey(myUsername)
  const navigate   = useNavigate()
  const visitBowl  = (encKey) => navigate(`/user/${encKey}`)

  const [accountsMap, setAccountsMap] = useState({})
  const [profilesMap, setProfilesMap] = useState({})
  const [myRelations, setMyRelations] = useState({})

  const [searchQuery, setSearchQuery] = useState('')
  const [chatWith, setChatWith]       = useState(null)
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

  function pushToast(text, kind = 'info') {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, kind }])
    const tid = setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
    timeoutsRef.current.push(tid)
  }

  // ── Categorize relations ──
  // chat.js stores entries as { status: 'sent' | 'received' | 'accepted', ... }
  const friends   = useMemo(() => Object.entries(myRelations).filter(([, v]) => v?.status === 'accepted').map(([k]) => k), [myRelations])
  const incoming  = useMemo(() => Object.entries(myRelations).filter(([, v]) => v?.status === 'received').map(([k]) => k), [myRelations])
  const outgoing  = useMemo(() => Object.entries(myRelations).filter(([, v]) => v?.status === 'sent').map(([k]) => k),     [myRelations])

  // ── Search candidates: every profile not me, matching the query ──
  const cleanedQuery = searchQuery.trim().toLowerCase()
  const searchResults = useMemo(() => {
    if (!cleanedQuery) return []
    return Object.keys(profilesMap)
      .filter(k => k !== myEncKey)
      .map(k => buildCard(k, accountsMap, profilesMap))
      .filter(card => {
        const u = card.username.toLowerCase()
        const n = card.displayName.toLowerCase()
        const e = (card.email || '').toLowerCase()
        return u.includes(cleanedQuery) || n.includes(cleanedQuery) || e.includes(cleanedQuery)
      })
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
  }, [cleanedQuery, profilesMap, accountsMap, myEncKey])

  // ── Actions ──
  function labelOf(encKey) {
    const card = buildCard(encKey, accountsMap, profilesMap)
    return card.displayName
  }

  function send(targetEncKey, displayName) {
    if (!targetEncKey || targetEncKey === myEncKey) return
    try {
      sendConnectionRequest(targetEncKey, displayName || targetEncKey)
      pushToast(`Friend request sent to ${displayName || targetEncKey}`, 'info')
    } catch (e) { console.error(e); pushToast('Could not send request — try again.', 'error') }
  }
  function cancel(targetEnc) {
    try {
      const card = buildCard(targetEnc, accountsMap, profilesMap)
      cancelConnection(targetEnc)
      pushToast(`Cancelled request to ${card.displayName}`, 'info')
    } catch (e) { console.error(e) }
  }
  function accept(targetEnc) {
    try {
      const card = buildCard(targetEnc, accountsMap, profilesMap)
      acceptConnection(targetEnc)
      pushToast(`You and ${card.displayName} are now friends`, 'success')
    } catch (e) { console.error(e) }
  }
  function decline(targetEnc) {
    try {
      const card = buildCard(targetEnc, accountsMap, profilesMap)
      declineConnection(targetEnc)
      pushToast(`Declined request from ${card.displayName}`, 'info')
    } catch (e) { console.error(e) }
  }
  function remove(targetEnc) {
    try {
      const card = buildCard(targetEnc, accountsMap, profilesMap)
      removeConnection(targetEnc)
      pushToast(`Removed ${card.displayName} from friends`, 'info')
    } catch (e) { console.error(e) }
  }

  // chat.js stores entries as { status, ts, ... }; expose just the status string.
  function statusOf(encKey) { return myRelations[encKey]?.status }

  // ── Reusable row for a person card ──
  function PersonRow({ card, actions }) {
    return (
      <div className="friend-item">
        <div className="friend-avatar-small">{card.displayName.charAt(0).toUpperCase()}</div>
        <div className="friend-body">
          <strong>{card.displayName}</strong>
          <p>{card.description}</p>
          <div className="friend-actions">{actions}</div>
        </div>
      </div>
    )
  }

  function SearchRow({ card }) {
    const status = statusOf(card.encKey)
    const bowlBtn = <button className="glass-btn small" onClick={() => visitBowl(card.encKey)}>🐠 Bowl</button>
    let actions
    if (status === 'accepted') {
      actions = (
        <>
          <span className="added-pill">Friends ✓</span>
          {bowlBtn}
          <button className="glass-btn small" onClick={() => setChatWith(card)}>Message</button>
        </>
      )
    } else if (status === 'sent') {
      actions = (
        <>
          <span className="pending-pill">Sent</span>
          {bowlBtn}
          <button className="glass-btn small" onClick={() => cancel(card.encKey)}>Cancel</button>
        </>
      )
    } else if (status === 'received') {
      actions = (
        <>
          <button className="glass-btn small primary" onClick={() => accept(card.encKey)}>Accept</button>
          <button className="glass-btn small"         onClick={() => decline(card.encKey)}>Decline</button>
          {bowlBtn}
        </>
      )
    } else {
      actions = (
        <>
          <button className="glass-btn small primary" onClick={() => send(card.encKey, card.displayName)}>Add Friend</button>
          {bowlBtn}
        </>
      )
    }
    return <PersonRow card={card} actions={actions} />
  }

  if (!myUsername) {
    return (
      <>
        <BubbleBackground count={16} />
        <Navbar />
        <main>
          <section className="connect-section">
            <div className="connect-empty">
              <h2>Friends</h2>
              <p>Sign in to manage your friends.</p>
            </div>
          </section>
        </main>
      </>
    )
  }

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
          <div className="friends-page-wrap">
            <header className="friends-page-header">
              <h2>Friends</h2>
              <p>Find people you know, accept requests, and message your shoal.</p>
            </header>

            {/* ── Search ── */}
            <div className="friends-search">
              <input
                className="profile-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username, name, or email…"
              />
            </div>
            {cleanedQuery && (
              <div className="friends-block">
                <div className="friends-block-header">
                  <h3>Search</h3>
                  <span className="friend-count">{searchResults.length}</span>
                </div>
                {searchResults.length === 0
                  ? <p className="no-friends">No matches. Make sure your friend has signed up or used FishNet.</p>
                  : (
                    <div className="friends-list">
                      {searchResults.map(card => <SearchRow key={card.encKey} card={card} />)}
                    </div>
                  )}
              </div>
            )}

            {/* ── Incoming Requests ── */}
            {incoming.length > 0 && (
              <div className="friends-block">
                <div className="friends-block-header">
                  <h3>Incoming Requests</h3>
                  <span className="friend-count incoming">{incoming.length}</span>
                </div>
                <div className="friends-list">
                  {incoming.map(encKey => {
                    const card = buildCard(encKey, accountsMap, profilesMap)
                    return (
                      <PersonRow
                        key={encKey}
                        card={{ ...card, description: 'wants to connect' }}
                        actions={(
                          <>
                            <button className="glass-btn small primary" onClick={() => accept(encKey)}>Accept</button>
                            <button className="glass-btn small"         onClick={() => decline(encKey)}>Decline</button>
                            <button className="glass-btn small"         onClick={() => visitBowl(encKey)}>🐠 Bowl</button>
                          </>
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* ── Friends ── */}
            <div className="friends-block">
              <div className="friends-block-header">
                <h3>Your Friends</h3>
                <span className="friend-count">{friends.length}</span>
              </div>
              {friends.length === 0
                ? <p className="no-friends">No friends yet. Search above or visit the Pod to send some requests.</p>
                : (
                  <div className="friends-list">
                    {friends.map(encKey => {
                      const card = buildCard(encKey, accountsMap, profilesMap)
                      return (
                        <PersonRow
                          key={encKey}
                          card={card}
                          actions={(
                            <>
                              <button className="glass-btn small"        onClick={() => visitBowl(encKey)}>🐠 Bowl</button>
                              <button className="glass-btn small"        onClick={() => setChatWith(card)}>Message</button>
                              <button className="glass-btn small danger" onClick={() => remove(encKey)}>Remove</button>
                            </>
                          )}
                        />
                      )
                    })}
                  </div>
                )}
            </div>

            {/* ── Sent Requests ── */}
            {outgoing.length > 0 && (
              <div className="friends-block">
                <div className="friends-block-header">
                  <h3>Sent Requests</h3>
                  <span className="friend-count pending">{outgoing.length}</span>
                </div>
                <div className="friends-list">
                  {outgoing.map(encKey => {
                    const card = buildCard(encKey, accountsMap, profilesMap)
                    return (
                      <PersonRow
                        key={encKey}
                        card={{ ...card, description: 'waiting for response…' }}
                        actions={(
                          <>
                            <button className="glass-btn small" onClick={() => visitBowl(encKey)}>🐠 Bowl</button>
                            <button className="glass-btn small" onClick={() => cancel(encKey)}>Cancel</button>
                          </>
                        )}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {chatWith && (
            <ChatModal
              me={myUsername}
              partner={chatWith}
              onClose={() => setChatWith(null)}
            />
          )}
        </section>
      </main>
    </>
  )
}
