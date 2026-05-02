import { db } from './firebase'
import { ref as dbRef, get, set, remove, onValue, update } from 'firebase/database'

function encodeKey(k) {
  return (k || '').toLowerCase().replace(/[.#$[\]/]/g, '_')
}

const relPath  = (user, other) => dbRef(db, `relations/${encodeKey(user)}/${encodeKey(other)}`)
const userRelsRoot = (user) => dbRef(db, `relations/${encodeKey(user)}`)

// Subscribe to my relations map. Calls onChange({ otherKey: status }).
export function subscribeMyRelations(myUsername, onChange) {
  if (!myUsername) { onChange({}); return () => {} }
  return onValue(userRelsRoot(myUsername), (snap) => onChange(snap.exists() ? (snap.val() || {}) : {}))
}

export async function loadRelations(myUsername) {
  if (!myUsername) return {}
  const snap = await get(userRelsRoot(myUsername))
  return snap.exists() ? (snap.val() || {}) : {}
}

// Send a friend request from `me` to `target`.
export async function sendRequest(me, target) {
  if (!me || !target || me === target) return
  await update(dbRef(db), {
    [`relations/${encodeKey(me)}/${encodeKey(target)}`]:    'pending_out',
    [`relations/${encodeKey(target)}/${encodeKey(me)}`]:    'pending_in',
  })
}

// Cancel my outgoing request OR remove a friend / decline an incoming one.
// Wipes both sides of the edge.
export async function clearRelation(me, target) {
  if (!me || !target) return
  await Promise.all([
    remove(relPath(me, target)),
    remove(relPath(target, me)),
  ])
}

export async function acceptRequest(me, target) {
  if (!me || !target) return
  await update(dbRef(db), {
    [`relations/${encodeKey(me)}/${encodeKey(target)}`]:    'friend',
    [`relations/${encodeKey(target)}/${encodeKey(me)}`]:    'friend',
  })
}
