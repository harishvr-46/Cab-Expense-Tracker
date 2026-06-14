import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../AuthContext'
import { api } from '../api'

export default function TripLogs() {
  const { user } = useContext(AuthContext)
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterVehicle, setFilterVehicle] = useState('')
  const [filterDriver, setFilterDriver] = useState('')
  const [selectedTrip, setSelectedTrip] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.get('/trips')
      .then((data) => setTrips(data))
      .catch(() => setTrips([]))
      .finally(() => setLoading(false))
  }, [])

  const displayedTrips = user?.role === 'driver'
    ? trips.filter((trip) => trip.driver_id === user.driver_id)
    : trips

  // Filter trips based on search and date range
  const filteredTrips = displayedTrips.filter((trip) => {
    const matchesSearch = searchText === '' || 
      trip.site?.toLowerCase().includes(searchText.toLowerCase()) ||
      trip.trip_type?.toLowerCase().includes(searchText.toLowerCase()) ||
      trip.vehicle_id?.toString().includes(searchText.toLowerCase()) ||
      trip.driver_id?.toString().includes(searchText.toLowerCase())
    
    const tripDate = new Date(trip.timestamp)
    const matchesDateFrom = dateFrom === '' || tripDate >= new Date(dateFrom)
    const matchesDateTo = dateTo === '' || tripDate <= new Date(dateTo)
    const matchesVehicle = filterVehicle === '' || trip.vehicle_id?.toString() === filterVehicle
    const matchesDriver = filterDriver === '' || trip.driver_id?.toString() === filterDriver

    return matchesSearch && matchesDateFrom && matchesDateTo && matchesVehicle && matchesDriver
  })

  const totalFare = filteredTrips.reduce((sum, trip) => sum + Number(trip.fare || 0), 0)
  const totalToll = filteredTrips.reduce((sum, trip) => sum + Number(trip.toll || 0), 0)

  const uniqueVehicles = [...new Set(displayedTrips.map(t => t.vehicle_id))]
  const uniqueDrivers = [...new Set(displayedTrips.map(t => t.driver_id))]

  function downloadCsv(rows, filename) {
    const csvContent = rows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportTripCsv() {
    const headers = ['Date', 'Site', 'Type', 'Vehicle', 'Driver', 'Fare', 'Toll']
    const rows = [headers.join(',')].concat(filteredTrips.map((trip) => [
      new Date(trip.timestamp).toLocaleDateString(),
      trip.site,
      trip.trip_type,
      trip.vehicle_id,
      trip.driver_id,
      trip.fare,
      trip.toll,
    ].map((cell) => `"${String(cell || '')}"`).join(',')))
    downloadCsv(rows, `trip-logs-${new Date().toISOString().slice(0,10)}.csv`)
  }

  return (
    <div>
      <div className="dashboard-header card">
        <div>
          <div className="dashboard-welcome">Trip logs</div>
          <h2 className="dashboard-title">{user?.role === 'driver' ? 'Your trip history' : 'All trip activity'}</h2>
          <p className="dashboard-subtitle">
            {user?.role === 'driver'
              ? 'Review your recent trips, fares and tolls in one place.'
              : 'Inspect all trip records, including fares, tolls and driver assignments.'}
          </p>
        </div>
        <div className="dashboard-pill">{trips.length} records</div>
      </div>

      {/* Align the three summary metrics in a single row */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(200px,1fr))' }}>
        <div className="card metric-card accent-card">
          <div className="metric-label">Total Trips</div>
          <div className="metric-value">{filteredTrips.length}</div>
          <div className="metric-note">in current filter</div>
        </div>
        <div className="card metric-card accent-card-secondary">
          <div className="metric-label">Total Fare</div>
          <div className="metric-value">₹{totalFare.toLocaleString()}</div>
          <div className="metric-note">sum of fares</div>
        </div>
        <div className="card metric-card accent-card-tertiary">
          <div className="metric-label">Total Tolls</div>
          <div className="metric-value">₹{totalToll.toLocaleString()}</div>
          <div className="metric-note">toll charges</div>
        </div>
      </div>

      <div className="card dashboard-section">
        <div className="section-header">
          <div>
            <h3>Filter & Search</h3>
            <p className="muted">Search trips by site, type, vehicle or driver.</p>
          </div>
          <button className="btn-export" onClick={exportTripCsv}>Export CSV</button>
        </div>
        <div className="filter-grid">
          <input 
            type="text" 
            placeholder="Search site or trip type..." 
            value={searchText} 
            onChange={(e) => setSearchText(e.target.value)}
            className="filter-input"
          />
          <input 
            type="date" 
            value={dateFrom} 
            onChange={(e) => setDateFrom(e.target.value)}
            className="filter-input"
            placeholder="From date"
          />
          <input 
            type="date" 
            value={dateTo} 
            onChange={(e) => setDateTo(e.target.value)}
            className="filter-input"
            placeholder="To date"
          />
          <select 
            value={filterVehicle} 
            onChange={(e) => setFilterVehicle(e.target.value)}
            className="filter-input"
          >
            <option value="">All vehicles</option>
            {uniqueVehicles.map(v => <option key={v} value={v}>{v || 'Unknown'}</option>)}
          </select>
          <select 
            value={filterDriver} 
            onChange={(e) => setFilterDriver(e.target.value)}
            className="filter-input"
          >
            <option value="">All drivers</option>
            {uniqueDrivers.map(d => <option key={d} value={d}>{d || 'Unknown'}</option>)}
          </select>
          <button 
            className="filter-reset"
            onClick={() => {
              setSearchText('')
              setDateFrom('')
              setDateTo('')
              setFilterVehicle('')
              setFilterDriver('')
            }}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <div className="card dashboard-section">
        <div className="section-header">
          <h3>Trip log details</h3>
          <span className="status-pill">{loading ? 'Loading...' : `${filteredTrips.length} rows`}</span>
        </div>
        <div className="table-scroll">
          <table className="table trip-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Site</th>
                <th>Type</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Fare</th>
                <th>Toll</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="muted">Loading trip logs...</td></tr>
              ) : filteredTrips.length === 0 ? (
                <tr><td colSpan={7} className="muted">No trip logs found matching your filters.</td></tr>
              ) : (
                filteredTrips.map((trip) => (
                  <tr
                    key={trip.id}
                    onClick={() => setSelectedTrip(trip)}
                    style={{ cursor: 'pointer', background: selectedTrip?.id === trip.id ? 'linear-gradient(90deg,rgba(223,128,220,0.08),rgba(214,85,211,0.04))' : 'transparent' }}
                  >
                    <td>{new Date(trip.timestamp).toLocaleDateString()}</td>
                    <td>{trip.site}</td>
                    <td><span style={{background:'linear-gradient(135deg,rgba(223,128,220,0.12),rgba(214,85,211,0.08))',padding:'4px 8px',borderRadius:8,fontSize:12,fontWeight:600}}>{trip.trip_type}</span></td>
                    <td>{trip.vehicle_id}</td>
                    <td>{trip.driver_id}</td>
                    <td style={{color:'var(--accent)',fontWeight:700}}>₹{trip.fare}</td>
                    <td style={{color:'var(--accent-2)',fontWeight:700}}>₹{trip.toll}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTrip && (
        <div className="card trip-detail-card">
          <div className="section-header">
            <div>
              <h3>Selected trip details</h3>
              <p className="muted">Tap a row to view the full trip record.</p>
            </div>
            <button className="btn-secondary" type="button" onClick={() => setSelectedTrip(null)}>Clear</button>
          </div>
          <div className="detail-grid">
            <div>
              <div className="detail-label">Date</div>
              <div>{new Date(selectedTrip.timestamp).toLocaleString()}</div>
            </div>
            <div>
              <div className="detail-label">Site</div>
              <div>{selectedTrip.site}</div>
            </div>
            <div>
              <div className="detail-label">Trip type</div>
              <div>{selectedTrip.trip_type}</div>
            </div>
            <div>
              <div className="detail-label">Vehicle</div>
              <div>{selectedTrip.vehicle_id}</div>
            </div>
            <div>
              <div className="detail-label">Driver</div>
              <div>{selectedTrip.driver_id}</div>
            </div>
            <div>
              <div className="detail-label">Fare</div>
              <div>₹{selectedTrip.fare}</div>
            </div>
            <div>
              <div className="detail-label">Toll</div>
              <div>₹{selectedTrip.toll}</div>
            </div>
            <div>
              <div className="detail-label">Distance</div>
              <div>{selectedTrip.distance_km || '-'} km</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="detail-label">Remarks</div>
              <div>{selectedTrip.remarks || '-'}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
