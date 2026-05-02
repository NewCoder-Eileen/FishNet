const ACCOUNTS_KEY = 'fishnet_accounts'
const SESSION_KEY  = 'fishnet_session'

function getAccounts() {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '{}') } catch { return {} }
}

export function isLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY)
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}

export function getAccountInfo(username) {
  const accounts = getAccounts()
  const key = username.trim().toLowerCase()
  if (!key || !accounts[key]) return null
  return { username: accounts[key].username, email: accounts[key].email || '' }
}

export function signup(username, password, email = '') {
  const accounts = getAccounts()
  const key = username.trim().toLowerCase()
  if (!key || !password) return { ok: false, error: 'Username and password are required.' }
  if (accounts[key]) return { ok: false, error: 'That username is already taken.' }
  accounts[key] = { username: username.trim(), password, email: email.trim() }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: username.trim() }))
  return { ok: true }
}

export function login(username, password) {
  const accounts = getAccounts()
  const key = username.trim().toLowerCase()
  const account = accounts[key]
  if (!account) return { ok: false, error: 'No account found with that username.' }
  if (account.password !== password) return { ok: false, error: 'Incorrect password.' }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: account.username }))
  return { ok: true }
}

export function logout() {
  localStorage.removeItem(SESSION_KEY)
}

export function changeUsername(currentUsername, password, newUsername) {
  const accounts = getAccounts()
  const key    = currentUsername.trim().toLowerCase()
  const newKey = newUsername.trim().toLowerCase()
  if (!accounts[key])          return { ok: false, error: 'Account not found.' }
  if (accounts[key].password !== password) return { ok: false, error: 'Incorrect password.' }
  if (!newKey)                 return { ok: false, error: 'Username cannot be empty.' }
  if (accounts[newKey])        return { ok: false, error: 'That username is already taken.' }
  accounts[newKey] = { ...accounts[key], username: newUsername.trim() }
  delete accounts[key]
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: newUsername.trim() }))
  return { ok: true }
}

export function changeEmail(username, password, newEmail) {
  const accounts = getAccounts()
  const key = username.trim().toLowerCase()
  if (!accounts[key])          return { ok: false, error: 'Account not found.' }
  if (accounts[key].password !== password) return { ok: false, error: 'Incorrect password.' }
  accounts[key] = { ...accounts[key], email: newEmail.trim() }
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts))
  return { ok: true }
}
