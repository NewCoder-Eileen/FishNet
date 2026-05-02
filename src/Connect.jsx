import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from './components/Navbar'
import BubbleBackground from './components/BubbleBackground'
import './App.css'

const FRIENDS = [
  { username: 'nova', displayName: 'Nova', description: 'Studio collaborator', mutualFriends: ['Echo', 'Sora'], email: 'nova@example.com', interests: ['Music', 'Art'], spotifyPlaylist: 'Nova\'s Beats', socials: { instagram: '@nova_art', twitter: '@nova_music', linkedin: 'nova-pro' }, resumeLink: 'nova-resume.com', pastEvents: ['Lan Party', 'Soundwave'] },
  { username: 'echo', displayName: 'Echo', description: 'Event partner', mutualFriends: ['Nova', 'Sora', 'Kai'], email: 'echo@example.com', interests: ['Travel', 'Technology'], spotifyPlaylist: 'Echo Vibes', socials: { instagram: '@echo_travel', twitter: '@echo_tech', linkedin: 'echo-events' }, resumeLink: 'echo-resume.com', pastEvents: ['Beach Jam', 'Startup Mixer'] },
  { username: 'sora', displayName: 'Sora', description: 'Creative mind', mutualFriends: ['Nova'], email: 'sora@example.com', interests: ['Books', 'Food'], spotifyPlaylist: 'Sora Sounds', socials: { instagram: '@sora_books', twitter: '@sora_food', linkedin: 'sora-creative' }, resumeLink: 'sora-resume.com', pastEvents: ['Festival'] },
  { username: 'kai', displayName: 'Kai', description: 'Beat maker', mutualFriends: ['Echo', 'Nova'], email: 'kai@example.com', interests: ['Music', 'Technology'], spotifyPlaylist: 'Kai Beats', socials: { instagram: '@kai_beats', twitter: '@kai_music', linkedin: 'kai-producer' }, resumeLink: 'kai-resume.com', pastEvents: ['Lan Party', 'Open Mic'] },
  { username: 'mira', displayName: 'Mira', description: 'Community curator', mutualFriends: ['Echo', 'Sora', 'Nova'], email: 'mira@example.com', interests: ['Art', 'Travel'], spotifyPlaylist: 'Mira Mix', socials: { instagram: '@mira_art', twitter: '@mira_travel', linkedin: 'mira-curator' }, resumeLink: 'mira-resume.com', pastEvents: ['Soundwave', 'Startup Mixer', 'Festival'] },
]

const findFriend = (username) => FRIENDS.find(f => f.username === username)
const labelOf    = (username) => findFriend(username)?.displayName ?? username

// Pre-seeded incoming requests so the Accept/Decline UX is visible from the start.
const INITIAL_RELATIONS = {
  echo: 'pending_in',
  mira: 'pending_in',
}

function Connect() {
  const [searchQuery, setSearchQuery]     = useState('')
  // relations: { [username]: 'pending_out' | 'pending_in' | 'friend' }
  const [relations, setRelations]         = useState(INITIAL_RELATIONS)
  const [selectedFriend, setSelectedFriend] = useState(null)
  const [toasts, setToasts]               = useState([])
  const timeoutsRef                       = useRef([])

  // Cancel any pending acceptance simulations on unmount
  useEffect(() => () => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
  }, [])

  const cleanedQuery = searchQuery.trim().toLowerCase()
  const foundFriend  = useMemo(
    () => FRIENDS.find(f => f.username.toLowerCase() === cleanedQuery),
    [cleanedQuery]
  )

  // Hide anyone with any kind of relation from recommendations.
  const recommendations = useMemo(
    () => FRIENDS.filter(f => f.mutualFriends.length >= 2 && !relations[f.username]),
    [relations]
  )

  const friendList = useMemo(() => Object.entries(relations).filter(([, s]) => s === 'friend').map(([u]) => u),       [relations])
  const incoming   = useMemo(() => Object.entries(relations).filter(([, s]) => s === 'pending_in').map(([u]) => u),   [relations])
  const outgoing   = useMemo(() => Object.entries(relations).filter(([, s]) => s === 'pending_out').map(([u]) => u),  [relations])

  const statusOf = (username) => relations[username]

  // ── Toasts ──
  function pushToast(text, kind = 'info') {
    const id = Date.now() + Math.random()
    setToasts(t => [...t, { id, text, kind }])
    const tid = setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id))
    }, 3500)
    timeoutsRef.current.push(tid)
  }

  // ── Relation actions ──
  function sendRequest(username) {
    if (relations[username]) return
    setRelations(r => ({ ...r, [username]: 'pending_out' }))
    pushToast(`Friend request sent to ${labelOf(username)}`, 'info')

    // Simulate the recipient accepting after a short delay so the demo plays out.
    const delay = 2500 + Math.random() * 3500
    const tid = setTimeout(() => {
      setRelations(prev => {
        if (prev[username] !== 'pending_out') return prev   // user cancelled
        // Defer the toast so we don't trigger a state update inside the setter.
        setTimeout(() => pushToast(`${labelOf(username)} accepted your request`, 'success'), 0)
        return { ...prev, [username]: 'friend' }
      })
    }, delay)
    timeoutsRef.current.push(tid)
  }

  function cancelRequest(username) {
    setRelations(r => {
      const next = { ...r }
      delete next[username]
      return next
    })
    pushToast(`Cancelled request to ${labelOf(username)}`, 'info')
  }

  function acceptRequest(username) {
    setRelations(r => ({ ...r, [username]: 'friend' }))
    pushToast(`You and ${labelOf(username)} are now friends`, 'success')
  }

  function declineRequest(username) {
    setRelations(r => {
      const next = { ...r }
      delete next[username]
      return next
    })
    pushToast(`Declined request from ${labelOf(username)}`, 'info')
  }

  function removeFriend(username) {
    setRelations(r => {
      const next = { ...r }
      delete next[username]
      return next
    })
    pushToast(`Removed ${labelOf(username)} from friends`, 'info')
  }

  function openProfile(friend)    { setSelectedFriend(friend) }
  function closeProfile()         { setSelectedFriend(null) }
  function messageFriend(username){ pushToast(`Messaging ${labelOf(username)}… (placeholder)`, 'info') }

  // ── Reusable relation action group ──
  function RelationActions({ username, size = 'md' }) {
    const status = statusOf(username)
    const sm = size === 'sm' ? ' small' : ''

    if (status === 'friend') {
      return <span className="added-pill">Added ✓</span>
    }
    if (status === 'pending_out') {
      return (
        <>
          <span className="pending-pill">Request Sent</span>
          <button className={`glass-btn${sm}`} onClick={() => cancelRequest(username)}>Cancel</button>
        </>
      )
    }
    if (status === 'pending_in') {
      return (
        <>
          <button className={`glass-btn primary${sm}`} onClick={() => acceptRequest(username)}>Accept</button>
          <button className={`glass-btn${sm}`}         onClick={() => declineRequest(username)}>Decline</button>
        </>
      )
    }
    return (
      <button className={`glass-btn primary${sm}`} onClick={() => sendRequest(username)}>Add Friend</button>
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
          <div className="connect-container">
            <div className="connect-main">
              <h2>Connect</h2>
              <p>Find friends by username. They'll need to accept your request before you're connected.</p>

              <div className="connect-search">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search username..."
                />
              </div>

              {cleanedQuery ? (
                <div className="connect-result">
                  {foundFriend ? (
                    <>
                      <strong>Match found</strong>
                      <p>{foundFriend.displayName} — {foundFriend.description}</p>
                      <p>Mutual friends: {foundFriend.mutualFriends.join(', ')}</p>
                      <div className="search-result-actions">
                        <button className="glass-btn" onClick={() => openProfile(foundFriend)}>View Profile</button>
                        <RelationActions username={foundFriend.username} />
                      </div>
                    </>
                  ) : (
                    <p className="no-match">No matching username found. Try another name.</p>
                  )}
                </div>
              ) : (
                <div className="connect-hint">
                  Search by username to find a friend and send them a request.
                </div>
              )}

              <div className="mutual-section">
                <h3>Recommended by mutual friends</h3>
                <div className="mutual-grid">
                  {recommendations.length === 0 && (
                    <p className="no-friends">No new recommendations right now.</p>
                  )}
                  {recommendations.map((friend) => (
                    <div key={friend.username} className="mutual-card">
                      <div className="mutual-avatar">{friend.displayName.charAt(0)}</div>
                      <div className="mutual-body">
                        <strong>{friend.displayName}</strong>
                        <p className="mutual-desc">{friend.description}</p>
                        <p className="mutual-shared">Shared friends: {friend.mutualFriends.join(', ')}</p>
                        <div className="mutual-actions">
                          <button className="glass-btn" onClick={() => openProfile(friend)}>View Profile</button>
                          <RelationActions username={friend.username} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="connect-sidebar">
              {incoming.length > 0 && (
                <div className="sidebar-block">
                  <div className="sidebar-header">
                    <h3>Incoming Requests</h3>
                    <span className="friend-count incoming">{incoming.length}</span>
                  </div>
                  <div className="friends-list">
                    {incoming.map((username) => {
                      const friend = findFriend(username)
                      return (
                        <div key={username} className="friend-item request-item">
                          <div className="friend-avatar-small">{friend.displayName.charAt(0)}</div>
                          <div className="friend-body">
                            <strong>{friend.displayName}</strong>
                            <p>wants to connect</p>
                            <div className="friend-actions">
                              <button className="glass-btn small" onClick={() => openProfile(friend)}>View</button>
                              <RelationActions username={username} size="sm" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="sidebar-block">
                <div className="sidebar-header">
                  <h3>Current Friends</h3>
                  <span className="friend-count">{friendList.length}</span>
                </div>
                <div className="friends-list">
                  {friendList.length > 0 ? friendList.map((username) => {
                    const friend = findFriend(username)
                    return (
                      <div key={username} className="friend-item">
                        <div className="friend-avatar-small">{friend.displayName.charAt(0)}</div>
                        <div className="friend-body">
                          <strong>{friend.displayName}</strong>
                          <p>{friend.description}</p>
                          <div className="friend-actions">
                            <button className="glass-btn small"        onClick={() => openProfile(friend)}>View</button>
                            <button className="glass-btn small"        onClick={() => messageFriend(username)}>Message</button>
                            <button className="glass-btn small danger" onClick={() => removeFriend(username)}>Remove</button>
                          </div>
                        </div>
                      </div>
                    )
                  }) : (
                    <p className="no-friends">No friends yet. Send some requests to get started!</p>
                  )}
                </div>
              </div>

              {outgoing.length > 0 && (
                <div className="sidebar-block">
                  <div className="sidebar-header">
                    <h3>Sent Requests</h3>
                    <span className="friend-count pending">{outgoing.length}</span>
                  </div>
                  <div className="friends-list">
                    {outgoing.map((username) => {
                      const friend = findFriend(username)
                      return (
                        <div key={username} className="friend-item request-item">
                          <div className="friend-avatar-small">{friend.displayName.charAt(0)}</div>
                          <div className="friend-body">
                            <strong>{friend.displayName}</strong>
                            <p>waiting for response…</p>
                            <div className="friend-actions">
                              <RelationActions username={username} size="sm" />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedFriend && (
            <div className="profile-modal-overlay" onClick={closeProfile}>
              <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
                <button className="close-modal glass-btn" onClick={closeProfile}>×</button>
                <div className="modal-header">
                  <h2>@{selectedFriend.username}</h2>
                  <p className="modal-subtitle">{selectedFriend.displayName}</p>
                </div>
                <div className="profile-details">
                  <p><strong>Email:</strong> {selectedFriend.email}</p>
                  <p><strong>Interests:</strong> {selectedFriend.interests.join(', ')}</p>
                  <p><strong>Spotify Playlist:</strong> <a href="#" className="link">{selectedFriend.spotifyPlaylist}</a></p>
                  <p><strong>Social Media:</strong></p>
                  <ul>
                    {selectedFriend.socials.instagram && <li><a href="#" className="link">{selectedFriend.socials.instagram}</a></li>}
                    {selectedFriend.socials.twitter   && <li><a href="#" className="link">{selectedFriend.socials.twitter}</a></li>}
                    {selectedFriend.socials.linkedin  && <li><a href="#" className="link">{selectedFriend.socials.linkedin}</a></li>}
                  </ul>
                  <p><strong>Resume:</strong> <a href="#" className="link">{selectedFriend.resumeLink}</a></p>
                  <p><strong>Past Events:</strong> {selectedFriend.pastEvents.join(', ')}</p>
                </div>
                <div className="modal-actions">
                  <RelationActions username={selectedFriend.username} />
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
