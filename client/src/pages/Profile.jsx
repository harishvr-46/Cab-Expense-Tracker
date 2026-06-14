import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../AuthContext'
import { api } from '../api'
import EarningsChart from '../components/EarningsChart'

export default function Profile() {
  const { user } = useContext(AuthContext)
  const [driver, setDriver] = useState(null)
  const [vehicle, setVehicle] = useState(null)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get('/trips')
      .then(setTrips)
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))

    if (user?.role === 'driver') {
      api.get('/drivers').then((data) => {
        setDriver(Array.isArray(data) ? data[0] : data)
      }).catch(() => setDriver(null))
      api.get('/vehicles').then((data) => {
        const assigned = Array.isArray(data) ? data[0] : data
        setVehicle(assigned)
      }).catch(() => setVehicle(null))
    }
  }, [user])

  const totalFare = trips.reduce((sum, trip) => sum + Number(trip.fare || 0), 0)
  const totalToll = trips.reduce((sum, trip) => sum + Number(trip.toll || 0), 0)
  const totalTrips = trips.length

  return (
    <div>
      <div className="dashboard-header card">
        <div>
          <div className="dashboard-welcome">Profile</div>
          <h2 className="dashboard-title">{user?.username || 'Driver'} profile</h2>
          <p className="dashboard-subtitle">
            {user?.role === 'driver'
              ? 'View your driver summary, earnings and assigned vehicle.'
              : 'Review your account and driver performance summary.'}
          </p>
        </div>
        <div className="dashboard-pill">{user?.role?.toUpperCase()}</div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(180px, 1fr))' }}>
        <div className="card metric-card accent-card">
          <div className="metric-label">Trips recorded</div>
          <div className="metric-value">{totalTrips}</div>
          <div className="metric-note">Trips in your profile history.</div>
        </div>
        <div className="card metric-card accent-card-secondary">
          <div className="metric-label">Total earnings</div>
          <div className="metric-value">₹{totalFare.toLocaleString()}</div>
          <div className="metric-note">Total fare earned from trips.</div>
        </div>
        <div className="card metric-card accent-card-tertiary">
          <div className="metric-label">Total tolls</div>
          <div className="metric-value">₹{totalToll.toLocaleString()}</div>
          <div className="metric-note">Toll expenses across trips.</div>
        </div>
      </div>

      {user?.role === 'driver' && (
        <div className="card dashboard-section profile-summary">
          <div className="section-header">
            <h3>Driver Profile</h3>
            <span className="status-pill">Driver ID: {user.driver_id}</span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 2fr',gap:24,alignItems:'start'}}>
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-start',gap:16}}>
              <div style={{width:200,height:200,borderRadius:24,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 12px 40px rgba(223,128,220,0.12)',overflow:'hidden',padding:6,background:'linear-gradient(135deg,rgba(223,128,220,0.12),rgba(214,85,211,0.08))'}}>
                <div style={{width:'100%',height:'100%',borderRadius:18,overflow:'hidden',background: 'var(--card)',display:'flex',alignItems:'center',justifyContent:'center',border:'4px solid rgba(223,128,220,0.12)'}}>
                  {driver?.profile_picture ? (
                    <img src={driver.profile_picture} alt="profile" style={{width:'100%',height:'100%',objectFit:'cover'}} />
                  ) : (
                    <div style={{fontSize:80,color:'rgba(223,128,220,0.3)'}}>👤</div>
                  )}
                </div>
              </div>
              <div style={{textAlign:'center'}}>
                <h3 style={{margin:0}}>{driver?.name || user.username}</h3>
                <p className="muted" style={{margin:'4px 0 0 0'}}>License: {driver?.licence || '-'}</p>
              </div>
            </div>
            <div className="profile-grid" style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12}}>
              <div style={{padding:12,background:'linear-gradient(135deg,rgba(223,128,220,0.05),rgba(214,85,211,0.03))',borderRadius:12,border:'1px solid rgba(223,128,220,0.1)'}}>
                <p className="muted" style={{margin:'0 0 8px 0',fontSize:12}}>Contact</p>
                <strong style={{fontSize:14}}>{driver?.contact_number || '-'}</strong>
              </div>
              <div style={{padding:12,background:'linear-gradient(135deg,rgba(223,128,220,0.05),rgba(214,85,211,0.03))',borderRadius:12,border:'1px solid rgba(223,128,220,0.1)'}}>
                <p className="muted" style={{margin:'0 0 8px 0',fontSize:12}}>Aadhaar</p>
                <strong style={{fontSize:14}}>{driver?.aadhaar || '-'}</strong>
              </div>
              <div style={{padding:12,background:'linear-gradient(135deg,rgba(223,128,220,0.05),rgba(214,85,211,0.03))',borderRadius:12,border:'1px solid rgba(223,128,220,0.1)'}}>
                <p className="muted" style={{margin:'0 0 8px 0',fontSize:12}}>PAN</p>
                <strong style={{fontSize:14}}>{driver?.pan || '-'}</strong>
              </div>
              <div style={{padding:12,background:'linear-gradient(135deg,rgba(223,128,220,0.05),rgba(214,85,211,0.03))',borderRadius:12,border:'1px solid rgba(223,128,220,0.1)'}}>
                <p className="muted" style={{margin:'0 0 8px 0',fontSize:12}}>PVC Status</p>
                <strong style={{fontSize:14}}>{driver?.pvc_status || '-'}</strong>
              </div>
              <div style={{padding:12,gridColumn:'1 / -1',background:'linear-gradient(135deg,rgba(223,128,220,0.05),rgba(214,85,211,0.03))',borderRadius:12,border:'1px solid rgba(223,128,220,0.1)'}}>
                <p className="muted" style={{margin:'0 0 8px 0',fontSize:12}}>Address</p>
                <strong style={{fontSize:14}}>{driver?.address || '-'}</strong>
              </div>
              <div style={{padding:12,gridColumn:'1 / -1',background:'linear-gradient(135deg,rgba(223,128,220,0.05),rgba(214,85,211,0.03))',borderRadius:12,border:'1px solid rgba(223,128,220,0.1)'}}>
                <p className="muted" style={{margin:'0 0 8px 0',fontSize:12}}>Emergency Contact</p>
                <strong style={{fontSize:14}}>{driver?.emergency_contact || '-'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'driver' && (
        <div className="card dashboard-section profile-summary">
          <div className="section-header">
            <h3>Your assigned vehicle</h3>
            <span className="status-pill">Vehicle Info</span>
          </div>
          <div className="profile-grid">
            <div>
              <p className="muted">Vehicle registration</p>
              <strong>{vehicle?.reg_no || 'Not assigned'}</strong>
            </div>
            <div>
              <p className="muted">Fuel type</p>
              <strong>{vehicle?.fuel_type || '-'}</strong>
            </div>
            <div>
              <p className="muted">Vehicle type</p>
              <strong>{vehicle?.type || '-'}</strong>
            </div>
          </div>
        </div>
      )}

      <EarningsChart trips={trips} />

      <div className="card dashboard-section">
        <div className="section-header">
          <h3>Recent trips</h3>
          <span className="status-pill">{loading ? 'Loading...' : `${totalTrips} records`}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Site</th>
              <th>Type</th>
              <th>Vehicle</th>
              <th>Fare</th>
              <th>Toll</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="muted">Loading profile trips...</td></tr>
            ) : totalTrips === 0 ? (
              <tr><td colSpan={6} className="muted">No trips found for this profile.</td></tr>
            ) : (
              trips.slice(0, 6).map((trip) => (
                <tr key={trip.id}>
                  <td>{new Date(trip.timestamp).toLocaleDateString()}</td>
                  <td>{trip.site}</td>
                  <td>{trip.trip_type}</td>
                  <td>{trip.vehicle_id}</td>
                  <td>₹{trip.fare}</td>
                  <td>₹{trip.toll}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
