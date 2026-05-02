import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { myUserId, getDmId, sendDm, markDmRead, subscribeDms, subscribeDmMessages } from '../lib/chat'
import { getSession } from '../lib/auth'
import '../App.css'

function fmt(ts) {
  if (!ts) return ''
  const d = new Date(ts), now = new Date()
  return d.toDateString() === now.toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function Messages() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const me              = myUserId()

  const [convos,      setConvos]      = useState([])
  const [activeDmId,  setActiveDmId]  = useState(null)
  const [activeConvo, setActiveConvo] = useState(null)
  const [messages,    setMessages]    = useState([])
  const [text,        setText]        = useState('')
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => subscribeDms(setConvos), [])

  // Open DM from ?user=id&name=displayname query params
  useEffect(() => {
    const user = params.get('user')
    const name = params.get('name') || user
    if (user && me) {
      const dmId = getDmId(me, user)
      setActiveDmId(dmId)
      setActiveConvo({ dmId, otherUserId: user, otherName: name })
      markDmRead(dmId)
    }
  }, [params, me])

  useEffect(() => {
    if (!activeDmId) { setMessages([]); return }
    markDmRead(activeDmId)
    return subscribeDmMessages(activeDmId, setMessages)
  }, [activeDmId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function openConvo(c) {
    setActiveDmId(c.dmId)
    setActiveConvo(c)
    markDmRead(c.dmId)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleSend() {
    if (!text.trim() || !activeConvo || !me) return
    sendDm(activeConvo.otherUserId, activeConvo.otherName, text)
    setText('')
    inputRef.current?.focus()
  }

  return (
    <div className="messages-page">
      <Navbar />
      <div className="messages-layout">

        {/* ── Sidebar ── */}
        <aside className={`messages-sidebar ${activeDmId ? 'sidebar-hidden-mobile' : ''}`}>
          <div className="messages-sidebar-hdr">
            <h2 className="messages-sidebar-title">Messages</h2>
          </div>

          {convos.length === 0 && (
            <p className="messages-empty">
              No conversations yet.<br />
              Message someone from their profile to start.
            </p>
          )}

          {convos.map(c => (
            <button
              key={c.dmId}
              className={`convo-row ${c.dmId === activeDmId ? 'convo-active' : ''}`}
              onClick={() => openConvo(c)}
            >
              <div className="convo-avatar">{(c.otherName || '?')[0].toUpperCase()}</div>
              <div className="convo-info">
                <span className="convo-name">@{c.otherName}</span>
                {c.lastText && <span className="convo-preview">{c.lastText.slice(0, 46)}</span>}
              </div>
              {c.unread && <span className="convo-unread-dot" />}
            </button>
          ))}
        </aside>

        {/* ── Chat area ── */}
        <main className={`messages-chat-area ${!activeDmId ? 'chat-hidden-mobile' : ''}`}>
          {!activeDmId ? (
            <div className="messages-placeholder">
              <div className="messages-placeholder-icon">💬</div>
              <p>Select a conversation</p>
            </div>
          ) : (
            <>
              <div className="messages-chat-hdr">
                <button
                  className="msg-back-btn"
                  onClick={() => { setActiveDmId(null); setActiveConvo(null) }}
                >
                  ←
                </button>
                <div className="msg-chat-user">
                  <div className="msg-chat-avatar">{(activeConvo?.otherName || '?')[0].toUpperCase()}</div>
                  <span className="msg-chat-title">@{activeConvo?.otherName}</span>
                </div>
                <button
                  className="msg-view-profile-btn"
                  onClick={() => navigate(`/user/${activeConvo?.otherUserId}`)}
                >
                  View Profile
                </button>
              </div>

              <div className="messages-chat-body">
                {messages.length === 0 && (
                  <p className="messages-chat-empty">Start the conversation!</p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`msg-wrap ${msg.from === me ? 'msg-wrap-mine' : 'msg-wrap-theirs'}`}>
                    <div className={`msg-bubble ${msg.from === me ? 'msg-bubble-mine' : 'msg-bubble-theirs'}`}>
                      {msg.text}
                    </div>
                    <span className="msg-ts">{fmt(msg.ts)}</span>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="messages-input-row">
                <input
                  ref={inputRef}
                  className="msg-text-input"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  placeholder={`Message @${activeConvo?.otherName}…`}
                  maxLength={500}
                />
                <button className="msg-send-btn" onClick={handleSend} disabled={!text.trim()}>
                  Send
                </button>
              </div>
            </>
          )}
        </main>

      </div>
    </div>
  )
}
