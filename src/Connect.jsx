import { useMemo, useState } from 'react'
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

function Connect() {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentFriends, setCurrentFriends] = useState([])
  const [selectedFriend, setSelectedFriend] = useState(null)

  const cleanedQuery = searchQuery.trim().toLowerCase()
  const foundFriend = useMemo(
    () => FRIENDS.find((friend) => friend.username.toLowerCase() === cleanedQuery),
    [cleanedQuery]
  )

  const mutualFriends = useMemo(
    () => FRIENDS.filter((friend) => friend.mutualFriends.length >= 2 && !currentFriends.includes(friend.username)),
    [currentFriends]
  )

  const addFriend = (username) => {
    const friend = FRIENDS.find(f => f.username === username)
    if (friend && !currentFriends.some(cf => FRIENDS.find(f => f.username === cf).email === friend.email)) {
      setCurrentFriends([...currentFriends, username])
    } else {
      alert('A profile with this email already exists in your friends.')
    }
  }

  const removeFriend = (username) => {
    setCurrentFriends(currentFriends.filter(f => f !== username))
  }

  const openProfile = (friend) => {
    setSelectedFriend(friend)
  }

  const closeProfile = () => {
    setSelectedFriend(null)
  }

  const messageFriend = (username) => {
    alert(`Messaging ${username}... (placeholder)`)
  }

  return (
    <>
      <BubbleBackground count={16} />
      <Navbar />
      <main>
        <section className="connect-section">
          <div className="connect-container">
          <div className="connect-main">
            <h2>Connect</h2>
            <p>Find friends by username.</p>

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
                    <strong>Match found:</strong>
                    <p>{foundFriend.displayName} — {foundFriend.description}</p>
                    <p>Mutual friends: {foundFriend.mutualFriends.join(', ')}</p>
                    <div className="search-result-actions">
                      <button className="glass-btn" onClick={() => openProfile(foundFriend)}>View Profile</button>
                      <button className="glass-btn" onClick={() => addFriend(foundFriend.username)}>Add Friend</button>
                    </div>
                  </>
                ) : (
                  <p className="no-match">No matching username found. Try another name.</p>
                )}
              </div>
            ) : (
              <div className="connect-hint">
                Search by username to find a friend and then add them by clicking Add Friend.
              </div>
            )}

            <div className="mutual-section">
              <h3>Recommended by mutual friends</h3>
              <div className="mutual-grid">
                {mutualFriends.map((friend) => (
                  <div key={friend.username} className="mutual-card">
                    <div className="mutual-avatar">{friend.displayName.charAt(0)}</div>
                    <div>
                      <strong>{friend.displayName}</strong>
                      <p>{friend.description}</p>
                      <p>Shared friends: {friend.mutualFriends.join(', ')}</p>
                      <button className="glass-btn" onClick={() => addFriend(friend.username)}>Add Friend</button>
                      <button className="glass-btn" onClick={() => openProfile(friend)}>View Profile</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="connect-sidebar">
            <h3>Current Friends</h3>
            <div className="friends-list">
              {currentFriends.length > 0 ? currentFriends.map((username) => {
                const friend = FRIENDS.find(f => f.username === username)
                return (
                  <div key={username} className="friend-item">
                    <div className="friend-avatar-small">{friend.displayName.charAt(0)}</div>
                    <div>
                      <strong>{friend.displayName}</strong>
                      <p>{friend.description}</p>
                      <div className="friend-actions">
                        <button className="glass-btn small" onClick={() => openProfile(friend)}>View</button>
                        <button className="glass-btn small" onClick={() => messageFriend(username)}>Msg</button>
                        <button className="glass-btn small danger" onClick={() => removeFriend(username)}>Remove</button>
                      </div>
                    </div>
                  </div>
                )
              }) : (
                <p className="no-friends">No friends yet. Add some from recommendations!</p>
              )}
            </div>
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
                  {selectedFriend.socials.twitter && <li><a href="#" className="link">{selectedFriend.socials.twitter}</a></li>}
                  {selectedFriend.socials.linkedin && <li><a href="#" className="link">{selectedFriend.socials.linkedin}</a></li>}
                </ul>
                <p><strong>Resume:</strong> <a href="#" className="link">{selectedFriend.resumeLink}</a></p>
                <p><strong>Past Events:</strong> {selectedFriend.pastEvents.join(', ')}</p>
              </div>
              <div className="modal-actions">
                <button className="glass-btn" onClick={() => addFriend(selectedFriend.username)}>Add Friend</button>
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