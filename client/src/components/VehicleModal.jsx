import React from 'react'

export default function VehicleModal({ vehicle, onClose }) {
  if (!vehicle) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header" style={{alignItems:'center',gap:16}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {vehicle.vehicle_picture ? <img src={vehicle.vehicle_picture} alt="vehicle" style={{width:96,height:64,objectFit:'cover',borderRadius:8}} /> : <div style={{width:96,height:64,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,rgba(223,128,220,0.08),rgba(214,85,211,0.06))',borderRadius:8,color:'var(--muted)',fontWeight:700}}>Car</div>}
            <div>
              <h2 style={{margin:0}}>{vehicle.reg_no}</h2>
              <div style={{color:'var(--muted)',fontSize:13}}>{vehicle.owner_name || vehicle.owner_id || '-'} — {vehicle.driver_name || vehicle.driver_id || '-'}</div>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-grid">
            <div className="modal-field">
              <span className="modal-label">Vehicle Type</span>
              <p>{vehicle.type || '-'}</p>
            </div>
            <div className="modal-field">
              <span className="modal-label">Fuel Type</span>
              <p>{vehicle.fuel_type || '-'}</p>
            </div>
            <div className="modal-field">
              <span className="modal-label">Owner</span>
              <p>{vehicle.owner_name || vehicle.owner_id || '-'}</p>
            </div>
            <div className="modal-field">
              <span className="modal-label">Driver</span>
              <p>{vehicle.driver_name || vehicle.driver_id || '-'}</p>
            </div>
            <div className="modal-field">
              <span className="modal-label">Registration Number</span>
              <p>{vehicle.reg_no}</p>
            </div>
            <div className="modal-field">
              <span className="modal-label">Status</span>
              <p className="status-active">Active</p>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
