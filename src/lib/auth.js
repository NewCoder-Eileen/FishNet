const ACCOUNTS_KEY = 'fishnet_accounts'
const SESSION_KEY  = 'fishnet_session'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── Demo account ──
// Use these to sign in instantly during a demo. The account auto-creates on
// first use (in any browser/profile), so you never have to sign up again.
export const DEMO_USERNAME = 'demo'
export const DEMO_PASSWORD = 'fishnet'
export const DEMO_EMAIL    = 'demo@fishnet.app'

export function signInAsDemo() {
  const accounts = getAccounts()
  if (!accounts[DEMO_USERNAME]) {
    accounts[DEMO_USERNAME] = {
      username: DEMO_USERNAME,
      password: DEMO_PASSWORD,
      email:    DEMO_EMAIL,
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: DEMO_USERNAME }))
  return { ok: true }
}

function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}') } catch { return {} }
}

function normEmail(email) { return (email || '').trim().toLowerCase() }
function normUser(user)   { return (user  || '').trim().toLowerCase() }

// Look up an account by email (case-insensitive). Returns { key, ...account } or null.
function findByEmail(email) {
  const accounts = getAccounts()
  const target = normEmail(email)
  if (!target) return null
  for (const [key, acc] of Object.entries(accounts)) {
    if (normEmail(acc.email) === target) return { key, ...acc }
  }
  return null
}

export function isLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY)
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function getAccountInfo(username) {
  const accounts = getAccounts()
  const key = normUser(username)
  if (!key || !accounts[key]) return null
  return { username: accounts[key].username, email: accounts[key].email || '' }
}

export function signup(username, password, email = '') {
  const accounts = getAccounts()
  const key       = normUser(username)
  const cleanMail = normEmail(email)

  if (!key || !password)            return { ok: false, error: 'Username and password are required.' }
  if (!cleanMail)                   return { ok: false, error: 'Email is required.' }
  if (!EMAIL_RE.test(cleanMail))    return { ok: false, error: 'Enter a valid email address.' }
  if (accounts[key])                return { ok: false, error: 'That username is already taken.' }
  if (findByEmail(cleanMail))       return { ok: false, error: 'An account already exists with this email. Try logging in instead.' }

  accounts[key] = { username: username.trim(), password, email: cleanMail }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  localStorage.setItem(SESSION_KEY,  JSON.stringify({ username: username.trim() }))
  return { ok: true }
}

// Accepts a username OR an email in `identifier`. Same password requirement.
// Email maps to exactly one account so login-by-email is unambiguous.
export function login(identifier, password) {
  const accounts = getAccounts()
  const input = (identifier || '').trim()
  if (!input || !password) return { ok: false, error: 'Enter your credentials.' }

  let account = null
  if (input.includes('@')) {
    const found = findByEmail(input)
    if (found) account = accounts[found.key]
  }
  if (!account) account = accounts[normUser(input)]

  if (!account)                              return { ok: false, error: 'No account found with that username or email.' }
  if (account.password !== password)         return { ok: false, error: 'Incorrect password.' }

  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username }))
  return { ok: true }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function changeUsername(currentUsername, password, newUsername) {
  const accounts = getAccounts()
  const key    = normUser(currentUsername)
  const newKey = normUser(newUsername)
  if (!accounts[key])                      return { ok: false, error: 'Account not found.' }
  if (accounts[key].password !== password) return { ok: false, error: 'Incorrect password.' }
  if (!newKey)                             return { ok: false, error: 'Username cannot be empty.' }
  if (newKey !== key && accounts[newKey])  return { ok: false, error: 'That username is already taken.' }
  accounts[newKey] = { ...accounts[key], username: newUsername.trim() }
  if (newKey !== key) delete accounts[key]
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  localStorage.setItem(SESSION_KEY,  JSON.stringify({ username: newUsername.trim() }))
  return { ok: true }
}

export function changeEmail(username, password, newEmail) {
  const accounts  = getAccounts()
  const key       = normUser(username)
  const cleanMail = normEmail(newEmail)

  if (!accounts[key])                          return { ok: false, error: 'Account not found.' }
  if (accounts[key].password !== password)     return { ok: false, error: 'Incorrect password.' }
  if (!cleanMail)                              return { ok: false, error: 'Email cannot be empty.' }
  if (!EMAIL_RE.test(cleanMail))               return { ok: false, error: 'Enter a valid email address.' }

  // Email must be unique. Allow keeping the same email on this account.
  const existing = findByEmail(cleanMail)
  if (existing && existing.key !== key)        return { ok: false, error: 'That email is already used by another account.' }

  accounts[key] = { ...accounts[key], email: cleanMail }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  return { ok: true }
}
