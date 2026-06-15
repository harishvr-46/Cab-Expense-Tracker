import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Vehicles from './pages/Vehicles'
import Drivers from './pages/Drivers'
import Admins from './pages/Admins'
import Profile from './pages/Profile'
import LogTrip from './pages/LogTrip'
import FuelEntry from './pages/FuelEntry'
import MonthlyReport from './pages/MonthlyReport'
import TripLogs from './pages/TripLogs'
import Login from './pages/Login'
import AuthProvider from './AuthContext'
import { RequireAuth, RequireRole } from './ProtectedRoute'

function AppRoutes() {
  const location = useLocation()
  const hideShell = location.pathname === '/login'
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')
    const isDark = storedTheme === 'dark'
    setDarkMode(isDark)
    document.documentElement.classList.toggle('dark-mode', isDark)
  }, [])

  function toggleTheme() {
    const next = !darkMode
    setDarkMode(next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark-mode', next)
  }

  if (hideShell) {
    return (
      <div className="container auth-layout">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <svg className="logo" viewBox="0 0 64 64" width="48" height="48" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <rect x="8" y="24" width="48" height="24" rx="4" fill="url(#grad1)" stroke="#df80dc" strokeWidth="2"/>
            <circle cx="16" cy="48" r="6" fill="#d655d3"/>
            <circle cx="48" cy="48" r="6" fill="#d655d3"/>
            <path d="M 12 24 L 12 12 Q 12 8 16 8 L 48 8 Q 52 8 52 12 L 52 24" fill="none" stroke="#df80dc" strokeWidth="2"/>
            <rect x="24" y="10" width="16" height="10" fill="rgba(223,128,220,0.1)" rx="2"/>
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{stopColor:'#df80dc',stopOpacity:0.8}} />
                <stop offset="100%" style={{stopColor:'#d655d3',stopOpacity:0.8}} />
              </linearGradient>
            </defs>
          </svg>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>Cab Expense Tracker</h1>
            <div className="muted">Monthly income & expense tracking</div>
          </div>
        </div>
        <div className="page-header-actions">
          <button className="theme-button" onClick={toggleTheme}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
        </div>
      </div>
      <Nav />
      <div className="page-shell">
        <Routes>
          <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
          {/* Vehicles and Drivers are for fleet, operations and super admins */}
          <Route path="/vehicles" element={<RequireRole roles={["admin"]}><Vehicles /></RequireRole>} />
          <Route path="/drivers" element={<RequireRole roles={["admin"]}><Drivers /></RequireRole>} />
          <Route path="/admins" element={<RequireRole roles={["super_admin"]}><Admins /></RequireRole>} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/trip-logs" element={<RequireAuth><TripLogs /></RequireAuth>} />
          <Route path="/log-trip" element={<RequireAuth><LogTrip /></RequireAuth>} />
          <Route path="/fuel-entry" element={<RequireAuth><FuelEntry /></RequireAuth>} />
          {/* Monthly report is admin-only */}
          <Route path="/monthly-report" element={<RequireRole roles={["super_admin","finance_admin","fleet_admin","operations_admin"]}><MonthlyReport /></RequireRole>} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
