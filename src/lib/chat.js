import { db } from './firebase'
import { ref, push, update, onValue, off, remove, get } from 'firebase/database'
import { getSession } from './auth'
import { useEffect, useState } from 'react'

// Match the encoding used by accounts/profiles/relations everywhere else so a
// signed-up `Eileen` and an event-broadcast `eileen` resolve to the same key.
export function myUserId() {
  const s = getSession()
  return s ? s.username.toLowerCase().replace(/[.#$[\]/]/g, '_') : null
}

export function getDmId(a, b) {
  return [a, b].sort().join('__')
}

export function sendDm(toUserId, toName, text) {
  const me = myUserId()
  if (!me || !text.trim()) return
  const session = getSession()
  const dmId = getDmId(me, toUserId)
  const ts = Date.now()
  const trimmed = text.trim()

  push(ref(db, `dms/${dmId}/messages`), { from: me, fromName: session.username, text: trimmed, ts })

  update(ref(db, `user_dms/${me}/${dmId}`), {
    otherUserId: toUserId, otherName: toName, lastText: trimmed, lastTs: ts, unread: false,
  })
  update(ref(db, `user_dms/${toUserId}/${dmId}`), {
    otherUserId: me, otherName: session.username, lastText: trimmed, lastTs: ts, unread: true,
  })
}

export function markDmRead(dmId) {
  const me = myUserId()
  if (!me) return
  update(ref(db, `user_dms/${me}/${dmId}`), { unread: false })
}

export function sendEventMessage(code, userId, displayName, text) {
  if (!text.trim()) return
  push(ref(db, `event_chat/${code}`), { userId, displayName, text: text.trim(), ts: Date.now() })
}

export function subscribeEventChat(code, cb) {
  const r = ref(db, `event_chat/${code}`)
  onValue(r, snap => {
    const data = snap.val() || {}
    cb(Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.ts - b.ts).slice(-80))
  })
  return () => off(r)
}

export function subscribeDms(cb) {
  const me = myUserId()
  if (!me) { cb([]); return () => {} }
  const r = ref(db, `user_dms/${me}`)
  onValue(r, snap => {
    const data = snap.val() || {}
    cb(Object.entries(data).map(([dmId, v]) => ({ dmId, ...v })).sort((a, b) => (b.lastTs || 0) - (a.lastTs || 0)))
  })
  return () => off(r)
}

export function subscribeDmMessages(dmId, cb) {
  const r = ref(db, `dms/${dmId}/messages`)
  onValue(r, snap => {
    const data = snap.val() || {}
    cb(Object.entries(data).map(([id, v]) => ({ id, ...v })).sort((a, b) => a.ts - b.ts))
  })
  return () => off(r)
}

// ── Connections (friend requests) ──

export function sendConnectionRequest(toUserId, toName) {
  const me = myUserId()
  if (!me) return
  const session = getSession()
  const ts = Date.now()
  update(ref(db, `connections/${me}/${toUserId}`), { status: 'sent',     ts, toName })
  update(ref(db, `connections/${toUserId}/${me}`), { status: 'received', ts, fromName: session.username })
}

export function acceptConnection(fromUserId) {
  const me = myUserId()
  if (!me) return
  update(ref(db, `connections/${me}/${fromUserId}`), { status: 'accepted' })
  update(ref(db, `connections/${fromUserId}/${me}`), { status: 'accepted' })
}

export function subscribeConnection(otherUserId, cb) {
  const me = myUserId()
  if (!me) { cb(null); return () => {} }
  const r = ref(db, `connections/${me}/${otherUserId}`)
  onValue(r, snap => cb(snap.val()))
  return () => off(r)
}

// Live view of every connection edge for the current user, keyed by other
// user's id: { otherId: { status, ts, ... } }
export function subscribeAllConnections(cb) {
  const me = myUserId()
  if (!me) { cb({}); return () => {} }
  const r = ref(db, `connections/${me}`)
  onValue(r, snap => cb(snap.val() || {}))
  return () => off(r)
}

// All three of cancel / decline / remove do the same thing: wipe both sides
// of the edge. Distinct names so call sites read clearly.
function clearBothSides(otherUserId) {
  const me = myUserId()
  if (!me || !otherUserId) return
  remove(ref(db, `connections/${me}/${otherUserId}`))
  remove(ref(db, `connections/${otherUserId}/${me}`))
}
export function cancelConnection(toUserId)    { clearBothSides(toUserId) }
export function declineConnection(fromUserId) { clearBothSides(fromUserId) }
export function removeConnection(otherUserId) { clearBothSides(otherUserId) }

export function useUnreadDmCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    return subscribeDms(convos => setCount(convos.filter(c => c.unread).length))
  }, [])
  return count
}

export function useIncomingRequestCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    return subscribeAllConnections(conns => {
      setCount(Object.values(conns).filter(c => c?.status === 'received').length)
    })
  }, [])
  return count
}

export async function getAcceptedConnectionCount() {
  const me = myUserId()
  if (!me) return 0
  try {
    const snap = await get(ref(db, `connections/${me}`))
    if (!snap.exists()) return 0
    return Object.values(snap.val()).filter(c => c?.status === 'accepted').length
  } catch { return 0 }
}
