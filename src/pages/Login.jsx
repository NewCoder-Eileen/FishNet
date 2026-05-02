import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, signup, signInAsDemo } from '../lib/auth'
import { seedDemoProfileIfEmpty } from '../lib/profile'
import BubbleBackground from '../components/BubbleBackground'
import loginFish from '../assets/login-fish.png'
import '../App.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const next     = location.state?.next || '/'

  const [mode, setMode]         = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState('')

  const [emailTaken, setEmailTaken] = useState(false)

  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setEmailTaken(false)
    if (busy) return
    setBusy(true)
    try {
      if (mode === 'signup') {
        if (password !== confirm) { setError("Passwords don't match."); return }
        const res = await signup(username, password, email)
        if (!res.ok) {
          setError(res.error)
          if (res.error.toLowerCase().includes('already exists')) setEmailTaken(true)
          return
        }
      } else {
        const res = await login(username, password)
        if (!res.ok) { setError(res.error); return }
      }
      navigate(next, { replace: true })
    } catch (err) {
      setError('Network error — please try again.')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  function switchToLoginWithEmail() {
    setMode('login')
    setUsername(email)
    setError('')
    setEmailTaken(false)
    setConfirm('')
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError(''); setConfirm(''); setEmail(''); setEmailTaken(false)
  }

  async function handleDemo() {
    if (busy) return
    setBusy(true)
    try {
      await signInAsDemo()
      await seedDemoProfileIfEmpty()
      navigate(next, { replace: true })
    } catch (err) {
      setError('Network error — please try again.')
      console.error(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login-page">
      <BubbleBackground count={16} />

      <div className="login-card">
        <img src={loginFish} alt="" className="login-logo-img" />
        <h1 className="login-title">fishnet</h1>
        <p className="login-subtitle">
          {mode === 'login' ? 'Welcome back, swimmer.' : 'Join the net.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field-wrap">
            <input
              className="login-input"
              type="text"
              placeholder={mode === 'login' ? 'Username or email' : 'Username'}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete={mode === 'login' ? 'username' : 'username'}
            />
            {mode === 'signup' && (
              <span className="login-field-hint">Pick a unique handle (your @name in the aquarium)</span>
            )}
          </div>

          {mode === 'signup' && (
            <div className="login-field-wrap">
              <input
                className="login-input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <span className="login-field-hint">One account per email — used to log back in later</span>
            </div>
          )}

          <input
            className="login-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />

          {mode === 'signup' && (
            <input
              className="login-input"
              type="password"
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          )}

          {error && <p className="login-error">{error}</p>}

          {emailTaken && (
            <button type="button" className="login-switch" onClick={switchToLoginWithEmail}>
              Log in with this email instead →
            </button>
          )}

          <button className="join-btn-primary login-submit" type="submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <button type="button" className="login-demo-btn" onClick={handleDemo}>
          🎬 Continue as demo
        </button>

        <button className="login-switch" onClick={switchMode}>
          {mode === 'login'
            ? "Don't have an account? Sign up"
            : 'Already have an account? Log in'}
        </button>

        <button className="login-back" onClick={() => navigate('/')}>← Back to home</button>
      </div>
    </div>
  )
}
