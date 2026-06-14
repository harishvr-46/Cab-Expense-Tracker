import React, { useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { AuthContext } from '../AuthContext'

export default function LogTrip(){
  const { user } = useContext(AuthContext)
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({ vehicle_id:'', driver_id:'', site:'Infosys', trip_type:'Pickup', distance_km:'', toll_route:'', toll:'', remarks:'' })
  const [message, setMessage] = useState(null)
  const [submitted, setSubmitted] = useState(false)

  const tollRoutes = [
    { key: 'ecf_single', label: 'Electronic City Flyover — Single Journey', amount: 65 },
    { key: 'ecf_return', label: 'Electronic City Flyover — Multiple Journeys (same day)', amount: 95 },
    { key: 'hr_tr', label: 'Hosur Road → Tumakuru Road', amount: 306 },
    { key: 'hr_lr', label: 'Hosur Road → Link Road', amount: 223 },
    { key: 'hr_br', label: 'Hosur Road → Bannerghatta Road', amount: 65 },
    { key: 'hr_kr', label: 'Hosur Road → Kanakapura Road', amount: 113 },
    { key: 'hr_mr', label: 'Hosur Road → Mysuru Road', amount: 161 },
    { key: 'tr_lr', label: 'Tumakuru Road → Link Road', amount: 233 },
    { key: 'br_lr', label: 'Bannerghatta Road → Link Road', amount: 158 },
    { key: 'kr_lr', label: 'Kanakapura Road → Link Road', amount: 110 },
    { key: 'mr_lr', label: 'Mysuru Road → Link Road', amount: 62 },
    { key: 'lr_clj', label: 'Link Road → Clover Leaf Junction', amount: 60 },
  ]

  useEffect(() => {
    if (user?.role === 'driver') {
      api.get('/vehicles').then(v => {
        const driverVehicles = v.filter(vehicle => vehicle.driver_id === user.driver_id)
        setVehicles(driverVehicles)
        // Auto-select vehicle if only one is assigned
        if (driverVehicles.length === 1) {
          setForm((prev) => ({ ...prev, driver_id: user.driver_id, vehicle_id: driverVehicles[0].id }))
        } else {
          setForm((prev) => ({ ...prev, driver_id: user.driver_id }))
        }
      }).catch(() => setVehicles([]))
    } else {
      api.get('/vehicles').then(setVehicles).catch(() => setVehicles([]))
      api.get('/drivers').then(setDrivers).catch(() => setDrivers([]))
    }
  }, [user])

  function submit(e){
    e.preventDefault()
    setMessage(null)
    setSubmitted(true)
    api.post('/trips', { ...form, distance_km: form.distance_km ? Number(form.distance_km) : null, toll: Number(form.toll || 0) })
        .then((res)=>{ 
          setMessage({ type: 'success', text: `✓ Trip saved! Calculated fare: ₹${res.fare}` })
          setForm({ vehicle_id:'', driver_id: user?.role === 'driver' ? user.driver_id : '', site:'Infosys', trip_type:'Pickup', distance_km:'', toll:'', remarks:'' })
          setSubmitted(false)
          setTimeout(() => setMessage(null), 5000)
        })
        .catch((err)=>{
          setMessage({ type: 'error', text: err.error || 'Failed to save trip' })
          setSubmitted(false)
        })
  }

  return (
    <div>
      <div className="dashboard-header card">
        <div>
          <div className="dashboard-welcome">🚗 Quick Trip Logger</div>
          <h2 className="dashboard-title">Record your trip in seconds</h2>
          <p className="dashboard-subtitle">{user?.role === 'driver' ? 'Your vehicle and account are ready. Just fill in trip details.' : 'Select vehicle and driver, then add trip details.'}</p>
        </div>
      </div>

      <div className="card trip-form-container">
        {message && (
          <div className={`message-alert message-${message.type}`}>
            <span className="message-icon">{message.type === 'success' ? '✓' : '✕'}</span>
            {message.text}
          </div>
        )}

        <form onSubmit={submit} className="trip-form-elegant">
          <div className="trip-form-section">
            <div className="section-title">Trip Details</div>
            
            <div className="form-row">
              <div className="form-group form-50">
                <label htmlFor="vehicle">Vehicle <span className="required">*</span></label>
                <select id="vehicle" value={form.vehicle_id} onChange={e=>setForm({...form, vehicle_id:e.target.value})} required disabled={user?.role === 'driver' && vehicles.length > 0}>
                  <option value="">{user?.role === 'driver' ? 'Your vehicle' : 'Select vehicle'}</option>
                  {vehicles.map(v=> <option key={v.id} value={v.id}>{v.reg_no} • {v.type}</option>)}
                </select>
              </div>
              {user?.role === 'admin' && (
                <div className="form-group form-50">
                  <label htmlFor="driver">Driver <span className="required">*</span></label>
                  <select id="driver" value={form.driver_id} onChange={e=>setForm({...form, driver_id:e.target.value})} required>
                    <option value="">Select driver</option>
                    {drivers.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="trip-form-section">
            <div className="section-title">Route Information</div>
            
            <div className="form-row">
              <div className="form-group form-50">
                <label htmlFor="site">Site <span className="required">*</span></label>
                <select id="site" value={form.site} onChange={e=>setForm({...form, site:e.target.value})}>
                  <option>Infosys</option>
                  <option>MUFG</option>
                </select>
              </div>
              <div className="form-group form-50">
                <label htmlFor="triptype">Trip Type <span className="required">*</span></label>
                <div className="trip-type-buttons">
                  <button type="button" className={`trip-btn ${form.trip_type === 'Pickup' ? 'active' : ''}`} onClick={() => setForm({...form, trip_type: 'Pickup'})}>
                    📍 Pickup
                  </button>
                  <button type="button" className={`trip-btn ${form.trip_type === 'Drop' ? 'active' : ''}`} onClick={() => setForm({...form, trip_type: 'Drop'})}>
                    🎯 Drop
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="trip-form-section">
            <div className="section-title">Expenses & Distance</div>
            
            <div className="form-row">
              <div className="form-group form-33">
                <label htmlFor="distance">Distance (km)</label>
                <div className="input-with-icon">
                  <span className="input-icon">📏</span>
                  <input id="distance" type="number" placeholder="0.0" value={form.distance_km} onChange={e=>setForm({...form, distance_km:e.target.value})} step="0.1" />
                </div>
              </div>
              <div className="form-group form-33">
                <label htmlFor="toll_route">Toll route</label>
                <select
                  id="toll_route"
                  value={form.toll_route}
                  onChange={(e) => {
                    const route = tollRoutes.find((route) => route.key === e.target.value)
                    setForm({
                      ...form,
                      toll_route: e.target.value,
                      toll: route ? route.amount.toString() : (e.target.value === 'custom' ? '' : form.toll),
                    })
                  }}
                >
                  <option value="">Select toll route</option>
                  {tollRoutes.map((route) => (
                    <option key={route.key} value={route.key}>{route.label} — ₹{route.amount}</option>
                  ))}
                  <option value="custom">Custom toll amount</option>
                </select>
              </div>
              <div className="form-group form-33">
                <label htmlFor="toll">Toll (₹)</label>
                <div className="input-with-icon">
                  <span className="input-icon">💰</span>
                  <input
                    id="toll"
                    type="number"
                    placeholder="0.00"
                    value={form.toll}
                    onChange={(e) => setForm({...form, toll:e.target.value})}
                    step="0.01"
                    readOnly={form.toll_route !== '' && form.toll_route !== 'custom'}
                  />
                </div>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group form-100">
                <label htmlFor="remarks">Remarks</label>
                <div className="input-with-icon">
                  <span className="input-icon">📝</span>
                  <input id="remarks" type="text" placeholder="Optional notes" value={form.remarks} onChange={e=>setForm({...form, remarks:e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-submit btn-submit-large" disabled={submitted}>
            {submitted ? '⏳ Saving...' : '✓ Save Trip'}
          </button>
        </form>
      </div>
    </div>
  )
}
