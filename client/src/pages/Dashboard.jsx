import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../AuthContext'
import { api } from '../api'
import VehicleModal from '../components/VehicleModal'

export default function Dashboard() {
  const { user } = useContext(AuthContext)
  const [vehicles, setVehicles] = useState([])
  const [trips, setTrips] = useState([])
  const [selectedVehicle, setSelectedVehicle] = useState(null)

  useEffect(() => {
    api.get('/vehicles').then(setVehicles).catch(() => setVehicles([]))
    api.get('/trips').then(setTrips).catch(() => setTrips([]))
  }, [])

  // Filter data based on user role
  const filteredTrips = user?.role === 'driver' ? trips.filter(t => t.driver_id === user.driver_id) : trips
  const filteredVehicles = user?.role === 'driver' ? vehicles.filter(v => v.driver_id === user.driver_id) : vehicles

  const totalFare = filteredTrips.reduce((sum, trip) => sum + Number(trip.fare || 0), 0)
  const totalToll = filteredTrips.reduce((sum, trip) => sum + Number(trip.toll || 0), 0)
  const firstName = user?.username?.split(' ')[0] ?? user?.role?.toUpperCase()
  const assignedVehicle = user?.role === 'driver' ? filteredVehicles[0] : null
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthlyTrips = filteredTrips.filter((trip) => trip.timestamp?.startsWith(currentMonth))
  const monthlyFare = monthlyTrips.reduce((sum, trip) => sum + Number(trip.fare || 0), 0)
  const monthlyToll = monthlyTrips.reduce((sum, trip) => sum + Number(trip.toll || 0), 0)
  const monthlyNet = monthlyFare - monthlyToll
  const [calc, setCalc] = useState({ distance: '', toll: '', fuel: '', fuelPrice: '' })
  const fuelExpense = Number(calc.fuel || 0) * Number(calc.fuelPrice || 0)
  const calculatorTotal = fuelExpense + Number(calc.toll || 0)
  const costPerKm = Number(calc.distance) > 0 ? calculatorTotal / Number(calc.distance) : 0

  return (
    <div className="dashboard-page">
      <div className="dashboard-header card">
        <div>
          <div className="dashboard-welcome">Welcome back, {firstName}</div>
          <h2 className="dashboard-title">{user?.role === 'driver' ? 'Driver dashboard' : 'Admin overview'}</h2>
          <p className="dashboard-subtitle">
            {user?.role === 'driver'
              ? 'Stay on top of your assigned vehicle with a dynamic car preview and quick status details.'
              : 'Review fleet activity, monitor expenses and manage vehicles with confidence.'}
          </p>
        </div>
        <div className="dashboard-pill">
          <span>{user?.role?.toUpperCase()}</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="card metric-card accent-card">
          <div className="metric-label">{user?.role === 'admin' ? 'Fleet vehicles' : 'My vehicles'}</div>
          <div className="metric-value">{filteredVehicles.length}</div>
          <div className="metric-note">{user?.role === 'admin' ? 'Real-time fleet' : 'Assigned to me'} availability.</div>
        </div>
        <div className="card metric-card accent-card-secondary">
          <div className="metric-label">My trips logged</div>
          <div className="metric-value">{filteredTrips.length}</div>
          <div className="metric-note">{user?.role === 'driver' ? 'Trips recorded.' : 'Total trips.'}</div>
        </div>
        <div className="card metric-card accent-card-tertiary">
          <div className="metric-label">Total fare</div>
          <div className="metric-value">₹{totalFare.toLocaleString()}</div>
          <div className="metric-note">{user?.role === 'driver' ? 'My earnings.' : 'Captured total.'}</div>
        </div>
        <div className="card metric-card accent-card-quaternary">
          <div className="metric-label">Total tolls</div>
          <div className="metric-value">₹{totalToll.toLocaleString()}</div>
          <div className="metric-note">{user?.role === 'driver' ? 'My toll costs.' : 'Toll summary.'}</div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))' }}>
        <div className="card summary-card">
          <div className="summary-top">
            <div>
              <h3>{user?.role === 'driver' ? 'Month-to-date summary' : 'Current fleet snapshot'}</h3>
              <p className="muted">{currentMonth} totals from recorded trips.</p>
            </div>
            <span className="status-pill">{monthlyTrips.length} trips</span>
          </div>
          <div className="summary-grid">
            <div>
              <span>Fare total</span>
              <strong>₹{monthlyFare.toLocaleString()}</strong>
            </div>
            <div>
              <span>Toll total</span>
              <strong>₹{monthlyToll.toLocaleString()}</strong>
            </div>
            <div>
              <span>Net estimate</span>
              <strong>₹{monthlyNet.toLocaleString()}</strong>
            </div>
          </div>
        </div>
        <div className="card calculator-card">
          <div className="summary-top">
            <div>
              <h3>Toll & fuel calculator</h3>
              <p className="muted">Quick expense estimate for your next trip.</p>
            </div>
          </div>
          <div className="calculator-grid">
            <label>
              Distance (km)
              <input type="number" min="0" value={calc.distance} onChange={(e) => setCalc({ ...calc, distance: e.target.value })} />
            </label>
            <label>
              Toll amount
              <input type="number" min="0" value={calc.toll} onChange={(e) => setCalc({ ...calc, toll: e.target.value })} />
            </label>
            <label>
              Fuel quantity (L)
              <input type="number" min="0" value={calc.fuel} onChange={(e) => setCalc({ ...calc, fuel: e.target.value })} />
            </label>
            <label>
              Fuel price (₹ / L)
              <input type="number" min="0" value={calc.fuelPrice} onChange={(e) => setCalc({ ...calc, fuelPrice: e.target.value })} />
            </label>
          </div>
          <div className="calculator-result">
            <div>
              <span>Total expense</span>
              <strong>₹{calculatorTotal.toFixed(2)}</strong>
            </div>
            <div>
              <span>Cost per km</span>
              <strong>₹{costPerKm.toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>

      {user?.role === 'driver' && (
        <div className="card dashboard-section vehicle-panel">
          <div className="vehicle-display">
            <div className="vehicle-animation">
              <svg viewBox="0 0 480 260" className="dzire-car-svg car-driving" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#2563eb',stopOpacity:1}} />
                    <stop offset="100%" style={{stopColor:'#0ea5e9',stopOpacity:1}} />
                  </linearGradient>
                  <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor:'#e0f2fe',stopOpacity:0.9}} />
                    <stop offset="100%" style={{stopColor:'#7dd3fc',stopOpacity:0.8}} />
                  </linearGradient>
                </defs>
                
                {/* Road/Ground - Static */}
                <rect x="20" y="185" width="440" height="60" fill="#d1d5db" />
                
                {/* Moving Road Lines */}
                <g className="moving-road">
                  <line x1="40" y1="215" x2="460" y2="215" stroke="#fff" strokeWidth="2" strokeDasharray="30,20" opacity="0.5" />
                </g>
                <g className="moving-road-secondary">
                  <line x1="-80" y1="215" x2="40" y2="215" stroke="#fff" strokeWidth="2" strokeDasharray="30,20" opacity="0.5" />
                </g>
                
                {/* Animated Car Group */}
                <g className="car-driving-group">
                  {/* Shadow under car */}
                  <ellipse cx="240" cy="192" rx="150" ry="12" fill="#000" opacity="0.08" />
                  
                  {/* Simple Car Body - Clean Sedan Shape */}
                  <path d="M 80 170 L 100 120 L 140 110 L 340 110 L 380 120 L 400 170 Z" fill="url(#carGradient)" stroke="#1e40af" strokeWidth="2" />
                  
                  {/* Front Bumper */}
                  <rect x="70" y="168" width="100" height="8" fill="#0f172a" rx="2" />
                  
                  {/* Headlights */}
                  <circle cx="85" cy="173" r="4" fill="#fde047" opacity="0.9" />
                  <circle cx="100" cy="173" r="4" fill="#fde047" opacity="0.9" />
                  
                  {/* Windshield - Front */}
                  <path d="M 115 138 L 150 110 L 240 110 L 225 175 Z" fill="url(#glassGradient)" stroke="#4b5563" strokeWidth="1.5" opacity="0.9" />
                  
                  {/* Windshield - Rear */}
                  <path d="M 240 110 L 330 110 L 310 175 L 255 175 Z" fill="url(#glassGradient)" stroke="#4b5563" strokeWidth="1.5" opacity="0.85" />
                  
                  {/* Door Line */}
                  <line x1="240" y1="120" x2="240" y2="170" stroke="#0f172a" strokeWidth="1" opacity="0.2" />
                  
                  {/* Rear Bumper */}
                  <rect x="310" y="168" width="100" height="8" fill="#0f172a" rx="2" />
                  
                  {/* Rear Light */}
                  <rect x="395" y="172" width="6" height="7" fill="#ef4444" opacity="0.9" rx="1" />
                  
                  {/* Left Wheel */}
                  <g>
                    <circle cx="150" cy="185" r="20" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                    <circle cx="150" cy="185" r="16" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    <circle cx="150" cy="185" r="8" fill="#475569" />
                    <g className="wheel-spokes" style={{transformOrigin:'150px 185px'}}>
                      <line x1="150" y1="165" x2="150" y2="173" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="170" y1="175" x2="162" y2="183" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="170" y1="195" x2="162" y2="187" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="150" y1="205" x2="150" y2="197" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="130" y1="195" x2="138" y2="187" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="130" y1="175" x2="138" y2="183" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                    </g>
                  </g>
                  
                  {/* Right Wheel */}
                  <g>
                    <circle cx="330" cy="185" r="20" fill="#1f2937" stroke="#374151" strokeWidth="2" />
                    <circle cx="330" cy="185" r="16" fill="none" stroke="#64748b" strokeWidth="1.5" />
                    <circle cx="330" cy="185" r="8" fill="#475569" />
                    <g className="wheel-spokes" style={{transformOrigin:'330px 185px'}}>
                      <line x1="330" y1="165" x2="330" y2="173" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="350" y1="175" x2="342" y2="183" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="350" y1="195" x2="342" y2="187" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="330" y1="205" x2="330" y2="197" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="310" y1="195" x2="318" y2="187" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                      <line x1="310" y1="175" x2="318" y2="183" stroke="#94a3b8" strokeWidth="1.5" opacity="0.85" />
                    </g>
                  </g>
                </g>
              </svg>
            </div>
            <div className="vehicle-details">
              <span className="vehicle-tag">Your assigned vehicle</span>
              {assignedVehicle ? (
                <>
                  <h3>{assignedVehicle.reg_no} • {assignedVehicle.type}</h3>
                  <p className="muted">Suzuki Dzire with animated wheels - your reliable partner on the road.</p>
                  <div className="vehicle-stats">
                    <div className="vehicle-stat">
                      <span>Fuel type</span>
                      <strong>{assignedVehicle.fuel_type}</strong>
                    </div>
                    <div className="vehicle-stat">
                      <span>Owner</span>
                      <strong>{assignedVehicle.owner_id || '-'}</strong>
                    </div>
                    <div className="vehicle-stat">
                      <span>Driver ID</span>
                      <strong>{assignedVehicle.driver_id || '-'}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h3>No vehicle assigned yet</h3>
                  <p className="muted">Once a vehicle is assigned, details and animated preview will appear here.</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="card dashboard-section">
        <div className="section-header">
          <h3>{user?.role === 'admin' ? 'Vehicle listing' : 'My assigned vehicles'}</h3>
          <span className="status-pill">{filteredVehicles.length} records</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Reg No</th>
              <th>Type</th>
              <th>Fuel</th>
              <th>Owner</th>
              <th>Driver</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehicles.length === 0 ? (
              <tr><td colSpan={5} className="muted">No vehicles found.</td></tr>
            ) : (
              filteredVehicles.map((v) => (
                <tr key={v.id} onClick={() => setSelectedVehicle(v)} style={{cursor: 'pointer'}}>
                  <td>{v.reg_no}</td>
                  <td>{v.type}</td>
                  <td>{v.fuel_type}</td>
                  <td>{v.owner_id || '-'}</td>
                  <td>{v.driver_id || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <VehicleModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  )
}
