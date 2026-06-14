import React, { useContext } from 'react'
import { Navigate } from 'react-router-dom'
import { AuthContext } from './AuthContext'

export function RequireAuth({ children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="card">Loading authentication...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

// Accepts either a single role string or an array of allowed roles
export function RequireRole({ roles, children }) {
  const { user, loading } = useContext(AuthContext)
  if (loading) return <div className="card">Loading authentication...</div>
  if (!user) return <Navigate to="/login" replace />
  const allowed = Array.isArray(roles) ? roles : [roles]
  // compute effective role: if user is an admin, use admin_level for fine-grained checks
  const effective = user.role === 'admin' ? user.admin_level : user.role
  if (!(allowed.includes(user.role) || allowed.includes(effective))) return <div className="card"><h2>Access denied</h2><p className="muted">You do not have permission to view this page.</p></div>
  return children
}
