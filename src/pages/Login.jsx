import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login, signup } from '../lib/auth'
import BubbleBackground from '../components/BubbleBackground'
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

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'signup') {
      if (password !== confirm) { setError("Passwords don't match."); return }
      const res = signup(username, password, email)
      if (!res.ok) { setError(res.error); return }
    } else {
      const res = login(username, password)
      if (!res.ok) { setError(res.error); return }
    }
    navigate(next, { replace: true })
  }

  function switchMode() {
    setMode(m => m === 'login' ? 'signup' : 'login')
    setError(''); setConfirm(''); setEmail('')
  }

  return (
    <div className="login-page">
      <BubbleBackground count={16} />

      <div className="login-card">
        <div className="login-logo">🐟</div>
        <h1 className="login-title">fishnet</h1>
        <p className="login-subtitle">
          {mode === 'login' ? 'Welcome back, swimmer.' : 'Join the net.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field-wrap">
            <input
              className="login-input"
              type="text"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoFocus
              autoComplete="username"
            />
            {mode === 'signup' && (
              <span className="login-field-hint">Not your email — pick a unique handle</span>
            )}
          </div>

          {mode === 'signup' && (
            <div className="login-field-wrap">
              <input
                className="login-input"
                type="email"
                placeholder="Email (optional — for account recovery)"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
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

          <button className="join-btn-primary login-submit" type="submit">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

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
