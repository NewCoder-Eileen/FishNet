import { db } from './firebase'
import { ref as dbRef, get, set, remove, onValue } from 'firebase/database'

const SESSION_KEY = 'fishnet_session'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Demo account auto-creates on first use.
export const DEMO_USERNAME = 'demo'
export const DEMO_PASSWORD = 'fishnet'
export const DEMO_EMAIL    = 'demo@fishnet.app'

// Firebase keys can't contain . # $ [ ] / — escape those chars while keeping
// most usernames readable in the DB.
// Match the encoding EventPage already uses for /profiles keys so existing
// data lines up with new writes (no orphan keys for users with emails).
function encodeKey(k) {
  return (k || '').toLowerCase().replace(/[.#$[\]/]/g, '_')
}
function normEmail(email) { return (email || '').trim().toLowerCase() }
function normUser(user)   { return (user  || '').trim().toLowerCase() }

const accountsRoot      = ()    => dbRef(db, 'accounts')
const accountPathByKey  = (key) => dbRef(db, `accounts/${encodeKey(key)}`)

// ── Subscriptions for components that want a live view of the user list ──
export function subscribeAccounts(onChange) {
  const r = accountsRoot()
  const unsub = onValue(r, (snap) => onChange(snap.exists() ? (snap.val() || {}) : {}))
  return unsub
}

export async function getAccounts() {
  const snap = await get(accountsRoot())
  return snap.exists() ? (snap.val() || {}) : {}
}

async function findByEmail(email) {
  const accounts = await getAccounts()
  const target = normEmail(email)
  if (!target) return null
  for (const [key, acc] of Object.entries(accounts)) {
    if (acc && normEmail(acc.email) === target) return { key, ...acc }
  }
  return null
}

// ── Session (kept in localStorage — sessions are per-device) ──
export function isLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY)
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

// ── Account info (one-shot read; for live data subscribe via subscribeAccounts) ──
export async function getAccountInfo(username) {
  const key = normUser(username)
  if (!key) return null
  const snap = await get(accountPathByKey(key))
  if (!snap.exists()) return null
  const acc = snap.val()
  return { username: acc.username, email: acc.email || '' }
}

// ── Demo ──
export async function signInAsDemo() {
  const snap = await get(accountPathByKey(DEMO_USERNAME))
  if (!snap.exists()) {
    await set(accountPathByKey(DEMO_USERNAME), {
      username: DEMO_USERNAME,
      password: DEMO_PASSWORD,
      email:    DEMO_EMAIL,
    })
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: DEMO_USERNAME }))
  return { ok: true }
}

// ── Signup ──
export async function signup(username, password, email = '') {
  const key       = normUser(username)
  const cleanMail = normEmail(email)

  if (!key || !password)         return { ok: false, error: 'Username and password are required.' }
  if (!cleanMail)                return { ok: false, error: 'Email is required.' }
  if (!EMAIL_RE.test(cleanMail)) return { ok: false, error: 'Enter a valid email address.' }

  const existing = await get(accountPathByKey(key))
  if (existing.exists())         return { ok: false, error: 'That username is already taken.' }

  const byEmail = await findByEmail(cleanMail)
  if (byEmail)                   return { ok: false, error: 'An account already exists with this email. Try logging in instead.' }

  await set(accountPathByKey(key), { username: username.trim(), password, email: cleanMail })
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: username.trim() }))
  return { ok: true }
}

// ── Login (username OR email) ──
export async function login(identifier, password) {
  const input = (identifier || '').trim()
  if (!input || !password) return { ok: false, error: 'Enter your credentials.' }

  let account = null
  if (input.includes('@')) {
    const found = await findByEmail(input)
    if (found) account = { key: found.key, ...found }
  }
  if (!account) {
    const snap = await get(accountPathByKey(normUser(input)))
    if (snap.exists()) account = { key: normUser(input), ...snap.val() }
  }

  if (!account)                       return { ok: false, error: 'No account found with that username or email.' }
  if (account.password !== password)  return { ok: false, error: 'Incorrect password.' }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username }))
  return { ok: true }
}

export async function changeUsername(currentUsername, password, newUsername) {
  const key    = normUser(currentUsername)
  const newKey = normUser(newUsername)
  const snap = await get(accountPathByKey(key))
  if (!snap.exists())                       return { ok: false, error: 'Account not found.' }
  const account = snap.val()
  if (account.password !== password)        return { ok: false, error: 'Incorrect password.' }
  if (!newKey)                              return { ok: false, error: 'Username cannot be empty.' }
  if (newKey !== key) {
    const existing = await get(accountPathByKey(newKey))
    if (existing.exists())                  return { ok: false, error: 'That username is already taken.' }
  }
  await set(accountPathByKey(newKey), { ...account, username: newUsername.trim() })
  if (newKey !== key) await remove(accountPathByKey(key))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: newUsername.trim() }))
  return { ok: true }
}

export async function changeEmail(username, password, newEmail) {
  const key       = normUser(username)
  const cleanMail = normEmail(newEmail)
  const snap = await get(accountPathByKey(key))
  if (!snap.exists())                          return { ok: false, error: 'Account not found.' }
  const account = snap.val()
  if (account.password !== password)           return { ok: false, error: 'Incorrect password.' }
  if (!cleanMail)                              return { ok: false, error: 'Email cannot be empty.' }
  if (!EMAIL_RE.test(cleanMail))               return { ok: false, error: 'Enter a valid email address.' }
  const existing = await findByEmail(cleanMail)
  if (existing && existing.key !== key)        return { ok: false, error: 'That email is already used by another account.' }
  await set(accountPathByKey(key), { ...account, email: cleanMail })
  return { ok: true }
}
