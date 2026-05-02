import { db } from './firebase'
import { ref, push, update, onValue, off } from 'firebase/database'
import { getSession } from './auth'
import { useEffect, useState } from 'react'

export function myUserId() {
  const s = getSession()
  return s ? s.username.replace(/\./g, '_') : null
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

export function useUnreadDmCount() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    return subscribeDms(convos => setCount(convos.filter(c => c.unread).length))
  }, [])
  return count
}
