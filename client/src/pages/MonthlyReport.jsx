import React, { useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { AuthContext } from '../AuthContext'

export default function MonthlyReport(){
  const { user } = useContext(AuthContext)
  const [vehicleId, setVehicleId] = useState('')
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7))
  const [report, setReport] = useState(null)
  const [vehicles, setVehicles] = useState([])

  // Only admin roles may access monthly reports (check admin_level for admin users)
  const ADMIN_ROLES = ['super_admin','finance_admin','fleet_admin','operations_admin']
  const effective = user?.role === 'admin' ? user?.admin_level : user?.role
  if (!ADMIN_ROLES.includes(effective)) {
    return (
      <div className="card">
        <h2>Access Denied</h2>
        <p className="muted">Monthly reports are available to admins only.</p>
      </div>
    )
  }

  useEffect(() => {
    api.get('/vehicles').then((data) => {
      setVehicles(data)
    }).catch(() => setVehicles([]))
  }, [user])

  function downloadCsv(rows, filename) {
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function exportReport() {
    if (!report) return
    const rows = [
      ['Category', 'Value'],
      ['Vehicle', report.vehicle?.reg_no || '-'],
      ['Month', month],
      ['Total Fare', report.summary?.total_fare || 0],
      ['Total Fuel', report.summary?.total_fuel || 0],
      ['Total Tolls', report.summary?.total_tolls || 0],
      ['Driver Salary', report.summary?.driver_salary || 0],
      ['Net', report.summary?.net || 0],
      [],
      ['Trip income summary', ''],
      ...((report.trip_income || []).map((row) => [row.site, `${row.trips} trips / ₹${row.total_fare}`])),
      [],
      ['Fuel summary', ''],
      ...((report.fuel || []).map((row) => [row.fuel_type, `₹${row.total_amount}`])),
    ].map((cells) => cells.map((cell) => `"${String(cell || '')}"`).join(','))
    downloadCsv(rows, `monthly-report-${month}-${report.vehicle?.reg_no || 'report'}.csv`)
  }

  function fetchReport(e){
    e && e.preventDefault()
    if(!vehicleId) return alert('vehicle id required')
    api.get(`/reports/monthly?vehicle_id=${vehicleId}&month=${month}`).then(setReport).catch(err=>alert(err.error||JSON.stringify(err)))
  }

  return (
    <div>
      <div className="dashboard-header card">
        <div>
          <div className="dashboard-welcome">Monthly report</div>
          <h2 className="dashboard-title">Vehicle expense summary</h2>
          <p className="dashboard-subtitle">Select any vehicle to generate the monthly report.</p>
        </div>
        <button className="btn-export" onClick={exportReport} disabled={!report}>Download report</button>
      </div>
      <form onSubmit={fetchReport} className="filter-row">
        <select value={vehicleId} onChange={e=>setVehicleId(e.target.value)}>
          <option value="">Select vehicle</option>
          {vehicles.map(v=> <option key={v.id} value={v.id}>{v.reg_no}</option>)}
        </select>
        <input type="month" value={month} onChange={e=>setMonth(e.target.value)} />
        <button type="submit">Get Report</button>
      </form>

      {report && (
        <div>
          <h3>Vehicle: {report.vehicle && report.vehicle.reg_no}</h3>
          <div>
            <strong>Trip Income</strong>
            <ul>{(report.trip_income||[]).map(r=> <li key={r.site}>{r.site}: ₹{r.total_fare} ({r.trips} trips)</li>)}</ul>
          </div>
          <div>
            <strong>Fuel</strong>
            <ul>{(report.fuel||[]).map(f=> <li key={f.fuel_type}>{f.fuel_type}: ₹{f.total_amount}</li>)}</ul>
          </div>
          <div><strong>Tolls:</strong> ₹{report.tolls}</div>
          <div><strong>Driver salary:</strong> ₹{report.driver_salary}</div>
          <div><strong>Net:</strong> ₹{report.summary && report.summary.net}</div>
        </div>
      )}
    </div>
  )
}
