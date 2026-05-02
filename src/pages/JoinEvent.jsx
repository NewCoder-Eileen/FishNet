import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import BubbleBackground from '../components/BubbleBackground'
import '../App.css'

function getEvents() {
  try { return JSON.parse(localStorage.getItem('fishnet_events') || '{}') }
  catch { return {} }
}

function saveEvent(code, name) {
  const events = getEvents()
  events[code] = { createdAt: Date.now(), name }
  localStorage.setItem('fishnet_events', JSON.stringify(events))
}

function getEvent(code) {
  return getEvents()[code.toUpperCase()] || null
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function JoinEvent() {
  const navigate = useNavigate()

  const [joinCode,  setJoinCode]  = useState('')
  const [joinError, setJoinError] = useState('')

  const [eventName,    setEventName]    = useState('')
  const [nameError,    setNameError]    = useState('')
  const [createdCode,  setCreatedCode]  = useState(null)
  const [createdName,  setCreatedName]  = useState('')
  const [copied,       setCopied]       = useState(false)

  function handleJoin() {
    const trimmed = joinCode.trim().toUpperCase()
    if (!trimmed) { setJoinError('Enter a code first'); return }
    const event = getEvent(trimmed)
    navigate(`/event/${trimmed}`, { state: { name: event?.name || trimmed } })
  }

  function handleCreate() {
    if (!eventName.trim()) { setNameError('Give your event a name first'); return }
    const code = generateCode()
    saveEvent(code, eventName.trim())
    setCreatedCode(code)
    setCreatedName(eventName.trim())
    setNameError('')
  }

  function handleCopy() {
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="join-page">
      <BubbleBackground count={14} />
      <Navbar />
      <button className="join-back" onClick={() => navigate('/')}>← Back</button>

      <div className="join-container">

        {/* ── Enter Code ── */}
        <div className="join-card join-card-primary">
          <div className="join-fish-icon">🐟</div>
          <h1 className="join-title">Enter Event Code</h1>
          <p className="join-desc">Got a code from a friend? Drop it in below.</p>

          <input
            className="join-input-big"
            value={joinCode}
            onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="ABC123"
            maxLength={6}
            autoFocus
            spellCheck={false}
          />
          {joinError && <p className="join-error">{joinError}</p>}

          <button className="join-dive-btn" onClick={handleJoin}>
            Dive In 🌊
          </button>
        </div>

        <div className="join-divider"><span>or</span></div>

        {/* ── Create Event ── */}
        <div className="join-card">
          <h2 className="join-title">Create an Event</h2>
          <p className="join-desc">Name your aquarium and share the code with your crew.</p>

          {!createdCode ? (
            <>
              <input
                className="join-input-name"
                value={eventName}
                onChange={e => { setEventName(e.target.value); setNameError('') }}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder="Event name…"
                maxLength={32}
              />
              {nameError && <p className="join-error">{nameError}</p>}
              <button className="join-btn-create" onClick={handleCreate}>
                Create Event
              </button>
            </>
          ) : (
            <div className="created-wrap">
              <p className="created-label">Event Name</p>
              <div className="created-name">{createdName}</div>
              <p className="created-label" style={{ marginTop: 12 }}>Your Code</p>
              <div className="created-code">{createdCode}</div>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
              <button
                className="join-dive-btn"
                style={{ marginTop: 4 }}
                onClick={() => navigate(`/event/${createdCode}`, { state: { name: createdName } })}
              >
                Enter Your Aquarium →
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}