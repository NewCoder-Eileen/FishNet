import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../App.css'

function getEvents() {
  try { return JSON.parse(localStorage.getItem('fishnet_events') || '{}') }
  catch { return {} }
}

function saveEvent(code) {
  const events = getEvents()
  events[code] = { createdAt: Date.now() }
  localStorage.setItem('fishnet_events', JSON.stringify(events))
}

function eventExists(code) {
  return code in getEvents()
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export default function JoinEvent() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [createdCode, setCreatedCode] = useState(null)
  const [copied, setCopied] = useState(false)

  function handleJoin() {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) { setError('Enter a code first'); return }
    if (eventExists(trimmed)) {
      navigate(`/event/${trimmed}`)
    } else {
      setError('No event found with that code — check it and try again.')
    }
  }

  function handleCreate() {
    const newCode = generateCode()
    saveEvent(newCode)
    setCreatedCode(newCode)
    setError('')
  }

  function handleCopy() {
    navigator.clipboard.writeText(createdCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="join-page">
      <button className="join-back" onClick={() => navigate('/')}>← Back</button>

      <div className="join-container">

        {/* ── Join section ── */}
        <div className="join-card">
          <h1 className="join-title">Enter Event Code</h1>
          <p className="join-desc">Got a code from a friend? Enter it below.</p>
          <input
            className="join-input"
            value={code}
            onChange={e => { setCode(e.target.value.toUpperCase()); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            placeholder="ABC123"
            maxLength={6}
            autoFocus
          />
          {error && <p className="join-error">{error}</p>}
          <button className="join-btn-primary" onClick={handleJoin}>
            Dive In 🐟
          </button>
        </div>

        <div className="join-divider"><span>or</span></div>

        {/* ── Create section ── */}
        <div className="join-card">
          <h2 className="join-title">Create an Event</h2>
          <p className="join-desc">Generate a code and share it with your crew.</p>

          {!createdCode ? (
            <button className="join-btn-create" onClick={handleCreate}>
              Create Event
            </button>
          ) : (
            <div className="created-wrap">
              <div className="created-code">{createdCode}</div>
              <button className="copy-btn" onClick={handleCopy}>
                {copied ? '✓ Copied!' : 'Copy Code'}
              </button>
              <button
                className="join-btn-primary"
                onClick={() => navigate(`/event/${createdCode}`)}
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