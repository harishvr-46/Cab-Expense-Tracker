import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../AuthContext'

export default function Login() {
  const { user, login } = useContext(AuthContext)
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    if (user) {
      navigate('/')
    }
  }, [user, navigate])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await login(form.username.trim(), form.password)
      navigate('/')
    } catch (err) {
      setError(err.error || 'Login failed')
    }
  }

  return (
    <div className="card auth-card">
      <div className="login-hero">
        <div className="cab-badge">
          <span>Cab</span>
          <small>Expense Tracker</small>
        </div>
        <div className="cab-motion">
          <div className="cab-icon" />
          <div className="cab-path">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
      <h2>Welcome back</h2>
      <p className="login-note">Sign in to access your driver or admin dashboard.</p>
      {error ? <div className="login-error">{error}</div> : null}
      <form onSubmit={submit} className="login-form">
        <input
          placeholder="Username"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
