import { db } from './firebase'
import { ref as dbRef, push, onValue, serverTimestamp } from 'firebase/database'

function encodeKey(k) {
  return (k || '').toLowerCase().replace(/[.#$[\]/]/g, '_')
}

// Two-party conversation id: the two encoded keys joined alphabetically so
// both participants resolve to the same path regardless of who looks first.
export function conversationId(a, b) {
  const [x, y] = [encodeKey(a), encodeKey(b)].sort()
  return `${x}__${y}`
}

const conversationPath = (a, b) => dbRef(db, `messages/${conversationId(a, b)}`)

// Subscribe to messages between two users. onChange receives a sorted array
// of { id, from, text, ts }.
export function subscribeMessages(a, b, onChange) {
  const r = conversationPath(a, b)
  return onValue(r, (snap) => {
    const val = snap.exists() ? (snap.val() || {}) : {}
    const list = Object.entries(val)
      .map(([id, m]) => ({ id, ...m }))
      .sort((x, y) => (x.ts || 0) - (y.ts || 0))
    onChange(list)
  })
}

export async function sendMessage(from, to, text) {
  const trimmed = (text || '').trim()
  if (!trimmed || !from || !to) return
  await push(conversationPath(from, to), {
    from,
    text: trimmed,
    ts:   serverTimestamp(),
  })
}
