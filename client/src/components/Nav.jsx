import React, { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../AuthContext'

export default function Nav() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  const adminRoles = ['admin','super_admin','fleet_admin','finance_admin','operations_admin']
  const effective = user?.role === 'admin' ? user?.admin_level || 'admin' : user?.role
  const canManageVehicles = effective && adminRoles.includes(effective)
  const canManageAdmins = effective === 'super_admin'

  return (
    <nav className="card nav-bar">
      {user ? (
        <>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/profile">Profile</Link>
            {canManageVehicles && <Link to="/vehicles">Vehicles</Link>}
            {canManageVehicles && <Link to="/drivers">Drivers</Link>}
            {canManageAdmins && <Link to="/admins">Admins</Link>}
            <Link to="/trip-logs">Trip Logs</Link>
            <Link to="/log-trip">Log Trip</Link>
            <Link to="/fuel-entry">Fuel Entry</Link>
            {canManageVehicles && <Link to="/monthly-report">Monthly Report</Link>}
          </div>

          <div className="nav-actions">
            <span className="nav-user">{user.username} ({effective})</span>
            <button className="plain-button" onClick={() => { logout().then(() => navigate('/login')) }}>Logout</button>
          </div>
        </>
      ) : (
        <div className="nav-actions">
          <Link to="/login">Login</Link>
        </div>
      )}
    </nav>
  )
}
