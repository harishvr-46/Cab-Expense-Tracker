import React, { useContext, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../AuthContext'

export default function Nav() {
  const { user, logout } = useContext(AuthContext)
  const [darkMode, setDarkMode] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    const isDark = storedTheme === 'dark'
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark-mode', isDark)
  }, [])

  function toggleTheme() {
    const nextMode = !darkMode
    setDarkMode(nextMode)
    localStorage.setItem('theme', nextMode ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark-mode', nextMode)
  }

  const adminRoles = ['admin','super_admin','fleet_admin','finance_admin','operations_admin']
  const effective = user?.role === 'admin' ? user?.admin_level || 'admin' : user?.role
  const canManageVehicles = effective && adminRoles.includes(effective)
  const canManageAdmins = effective === 'super_admin'

  return (
    <nav className="card nav-bar">
      {user ? (
        <>
          <Link to="/">Dashboard</Link>
          <Link to="/profile">Profile</Link>
          {canManageVehicles && <Link to="/vehicles">Vehicles</Link>}
          {canManageVehicles && <Link to="/drivers">Drivers</Link>}
          {canManageAdmins && <Link to="/admins">Admins</Link>}
          <Link to="/trip-logs">Trip Logs</Link>
          <Link to="/log-trip">Log Trip</Link>
          <Link to="/fuel-entry">Fuel Entry</Link>
          {canManageVehicles && <Link to="/monthly-report">Monthly Report</Link>}

          {/* Toggle switch instead of a plain button */}
          <label className="toggle-switch" title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <input type="checkbox" checked={darkMode} onChange={toggleTheme} />
            <span className="switch-slider" />
          </label>

          <button className="plain-button" onClick={() => { logout().then(() => navigate('/login')) }}>Logout</button>
          <span className="nav-user">{user.username} ({effective})</span>
        </>
      ) : (
        <Link to="/login">Login</Link>
      )}
    </nav>
  )
}
