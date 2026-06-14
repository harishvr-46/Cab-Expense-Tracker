import React, { useEffect, useState } from 'react'
import { api } from '../api'
import VehicleModal from '../components/VehicleModal'

export default function Vehicles() {
  const [list, setList] = useState([])
  const [owners, setOwners] = useState([])
  const [drivers, setDrivers] = useState([])
  const [form, setForm] = useState({ reg_no: '', type: 'Sedan', fuel_type: 'CNG', owner_id: '', driver_id: '', rc_document: '', insurance_document: '', permit_document: '', child_lock_certificate: '', fire_extinguisher_present: false, umbrella_present: false, torch_light_present: false, first_aid_box_present: false, other_equipment: '', vehicle_picture: '' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  const [vehicleError, setVehicleError] = useState('')
  const [fileErrors, setFileErrors] = useState({})

  function getBase64SizeKb(base64){
    if(!base64) return 0
    const parts = base64.split(',')
    const data = parts[1] || parts[0]
    const sizeInBytes = Math.ceil(data.length * 3 / 4)
    return sizeInBytes / 1024
  }

  function handleFileField(field, file, maxMb = 2){
    if(!file) return
    // allow images and pdf
    if(!(file.type.startsWith('image/') || file.type === 'application/pdf')){
      setFileErrors(prev=>({ ...prev, [field]: 'Only images or PDF allowed' }))
      return
    }
    if(file.size > maxMb * 1024 * 1024){
      setFileErrors(prev=>({ ...prev, [field]: `File too large (max ${maxMb}MB)` }))
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setForm(prev=>({ ...prev, [field]: dataUrl }))
      setFileErrors(prev=>({ ...prev, [field]: '' }))
    }
    reader.readAsDataURL(file)
  }

  useEffect(() => { load() }, [])

  function load() {
    api.get('/vehicles').then(setList).catch(() => setList([]))
    api.get('/owners').then(setOwners).catch(() => setOwners([]))
    api.get('/drivers').then(setDrivers).catch(() => setDrivers([]))
  }

  async function submit(e) {
    e.preventDefault()
    setVehicleError('')
    if (!form.reg_no) { setVehicleError('Registration number is required'); return false }
    // validate vehicle picture size if present
    if (form.vehicle_picture){
      const sizeKb = getBase64SizeKb(form.vehicle_picture)
      if (sizeKb > 1024){ setVehicleError('Image too large. Max 1MB'); return false }
    }
    try{
      await api.post('/vehicles', form)
      load()
      setForm({ reg_no: '', type: 'Sedan', fuel_type: 'CNG', owner_id: '', driver_id: '', rc_document: '', insurance_document: '', permit_document: '', child_lock_certificate: '', fire_extinguisher_present: false, umbrella_present: false, torch_light_present: false, first_aid_box_present: false, other_equipment: '', vehicle_picture: '' })
      return true
    }catch(err){
      setVehicleError(err.error || JSON.stringify(err))
      return false
    }
  }

  function saveEdit(id) {
    const vehicle = list.find((item) => item.id === id)
    api.put('/vehicles/' + id, vehicle)
      .then(() => {
        setEditing(null)
        load()
      })
      .catch((err) => alert(err.error || JSON.stringify(err)))
  }

  function deleteVehicle(id) {
    if (!window.confirm('Delete this vehicle?')) return
    api.delete('/vehicles/' + id)
      .then(() => load())
      .catch((err) => alert(err.error || JSON.stringify(err)))
  }

  return (
    <div className="container">
      <div className="dashboard-header card">
        <div>
          <div className="dashboard-welcome">Vehicle management</div>
          <h2 className="dashboard-title">Admin vehicle control</h2>
          <p className="dashboard-subtitle">Add, edit or inspect vehicles in the fleet with a quick detail view.</p>
        </div>
      </div>
      <div className="card dashboard-section">
        <div style={{display:'flex',justifyContent:'flex-end',marginBottom:12}}>
          <button className="btn-submit-large" onClick={(e)=>{e.preventDefault(); setShowAddModal(true)}}>Add vehicle</button>
        </div>
        {showAddModal && (
          <div className="modal-overlay" onClick={()=>setShowAddModal(false)}>
            <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add Vehicle</h2>
                <button className="modal-close" onClick={()=>setShowAddModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <form onSubmit={async (e)=>{ const ok = await submit(e); if(ok) setShowAddModal(false); }} className="form-grid">
                  <div className="form-group">
                    <label>Registration</label>
                    <input placeholder="Reg no" value={form.reg_no} onChange={(e) => setForm({ ...form, reg_no: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                      <option>Sedan</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fuel type</label>
                    <select value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })}>
                      <option>CNG</option>
                      <option>Petrol</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Owner</label>
                    <select value={form.owner_id} onChange={(e) => setForm({ ...form, owner_id: e.target.value })}>
                      <option value="">None</option>
                      {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Driver</label>
                    <select value={form.driver_id} onChange={(e) => setForm({ ...form, driver_id: e.target.value })}>
                      <option value="">None</option>
                      {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>RC document (image or PDF, max 2MB)</label>
                    <div style={{border:'2px dashed rgba(255,255,255,0.06)',padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:12,flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) handleFileField('rc_document', f, 2)}}>
                      {form.rc_document ? (form.rc_document.startsWith('data:image/') ? <img src={form.rc_document} style={{width:140,height:80,objectFit:'cover',borderRadius:6}} /> : <div style={{padding:8,background:'rgba(255,255,255,0.02)',width:'100%',textAlign:'center',borderRadius:6}}>PDF attached</div>) : <div style={{color:'var(--muted)'}}>Drop file here or click to choose</div>}
                      <input type="file" accept="image/*,application/pdf" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(f) handleFileField('rc_document', f, 2) }} />
                      {fileErrors.rc_document && <div className="message-error">{fileErrors.rc_document}</div>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Insurance document (image or PDF, max 2MB)</label>
                    <div style={{border:'2px dashed rgba(255,255,255,0.06)',padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:12,flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) handleFileField('insurance_document', f, 2)}}>
                      {form.insurance_document ? (form.insurance_document.startsWith('data:image/') ? <img src={form.insurance_document} style={{width:140,height:80,objectFit:'cover',borderRadius:6}} /> : <div style={{padding:8,background:'rgba(255,255,255,0.02)',width:'100%',textAlign:'center',borderRadius:6}}>PDF attached</div>) : <div style={{color:'var(--muted)'}}>Drop file here or click to choose</div>}
                      <input type="file" accept="image/*,application/pdf" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(f) handleFileField('insurance_document', f, 2) }} />
                      {fileErrors.insurance_document && <div className="message-error">{fileErrors.insurance_document}</div>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Permit document (image or PDF, max 2MB)</label>
                    <div style={{border:'2px dashed rgba(255,255,255,0.06)',padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:12,flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) handleFileField('permit_document', f, 2)}}>
                      {form.permit_document ? (form.permit_document.startsWith('data:image/') ? <img src={form.permit_document} style={{width:140,height:80,objectFit:'cover',borderRadius:6}} /> : <div style={{padding:8,background:'rgba(255,255,255,0.02)',width:'100%',textAlign:'center',borderRadius:6}}>PDF attached</div>) : <div style={{color:'var(--muted)'}}>Drop file here or click to choose</div>}
                      <input type="file" accept="image/*,application/pdf" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(f) handleFileField('permit_document', f, 2) }} />
                      {fileErrors.permit_document && <div className="message-error">{fileErrors.permit_document}</div>}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Child lock certificate (image or PDF, max 2MB)</label>
                    <div style={{border:'2px dashed rgba(255,255,255,0.06)',padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:12,flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) handleFileField('child_lock_certificate', f, 2)}}>
                      {form.child_lock_certificate ? (form.child_lock_certificate.startsWith('data:image/') ? <img src={form.child_lock_certificate} style={{width:140,height:80,objectFit:'cover',borderRadius:6}} /> : <div style={{padding:8,background:'rgba(255,255,255,0.02)',width:'100%',textAlign:'center',borderRadius:6}}>PDF attached</div>) : <div style={{color:'var(--muted)'}}>Drop file here or click to choose</div>}
                      <input type="file" accept="image/*,application/pdf" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(f) handleFileField('child_lock_certificate', f, 2) }} />
                      {fileErrors.child_lock_certificate && <div className="message-error">{fileErrors.child_lock_certificate}</div>}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Equipment</label>
                    <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center'}}>
                      <label style={{display:'inline-flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={form.fire_extinguisher_present} onChange={(e)=> setForm({...form, fire_extinguisher_present: e.target.checked})} /> Fire extinguisher</label>
                      <label style={{display:'inline-flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={form.umbrella_present} onChange={(e)=> setForm({...form, umbrella_present: e.target.checked})} /> Umbrella</label>
                      <label style={{display:'inline-flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={form.torch_light_present} onChange={(e)=> setForm({...form, torch_light_present: e.target.checked})} /> Torch</label>
                      <label style={{display:'inline-flex',gap:8,alignItems:'center'}}><input type="checkbox" checked={form.first_aid_box_present} onChange={(e)=> setForm({...form, first_aid_box_present: e.target.checked})} /> First aid box</label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Vehicle picture (max 1MB)</label>
                    <div style={{border:'2px dashed #e6eefc',padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:12,flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f){ if(!f.type.startsWith('image/')){ setVehicleError('Only image files are allowed'); return } if(f.size > 1024*1024){ setVehicleError('Image too large. Max 1MB'); return } const reader = new FileReader(); reader.onload = (ev)=>{ setVehicleError(''); setForm({...form, vehicle_picture: ev.target.result}) }; reader.readAsDataURL(f) } }}>
                      {form.vehicle_picture ? <img src={form.vehicle_picture} style={{width:200,height:120,objectFit:'cover',borderRadius:8}} /> : <div style={{color:'var(--muted)'}}>Drop car image here or click to choose</div>}
                      <input type="file" accept="image/*" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(!f) return; if(!f.type.startsWith('image/')){ setVehicleError('Only image files are allowed'); return } if(f.size > 1024*1024){ setVehicleError('Image too large. Max 1MB'); return } const reader = new FileReader(); reader.onload = (ev)=>{ setVehicleError(''); setForm({...form, vehicle_picture: ev.target.result}) }; reader.readAsDataURL(f) }} />
                      {vehicleError && <div className="message-error" style={{marginTop:8}}>{vehicleError}</div>}
                    </div>
                  </div>

                  <div className="form-group form-actions">
                    <button type="submit" className="btn-submit-large">Add vehicle</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className="table-scroll vehicles-scroll">
          <table className="table vehicles-table">
            <thead>
              <tr><th>Photo</th><th>Reg</th><th>Type</th><th>Fuel</th><th>Owner</th><th>Driver</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id}>
                  <td className="vehicle-cell">{v.vehicle_picture ? <img className="vehicle-img" src={v.vehicle_picture} alt="vehicle" /> : <div className="vehicle-placeholder">Car</div>}</td>
                  <td>{editing === v.id ? <input value={v.reg_no} onChange={(e) => { v.reg_no = e.target.value; setList([...list]) }} /> : <strong style={{display:'block'}}>{v.reg_no}</strong>}</td>
                  <td>{editing === v.id ? <select value={v.type} onChange={(e) => { v.type = e.target.value; setList([...list]) }}><option>Sedan</option><option>Other</option></select> : v.type}</td>
                  <td>{editing === v.id ? <select value={v.fuel_type} onChange={(e) => { v.fuel_type = e.target.value; setList([...list]) }}><option>CNG</option><option>Petrol</option></select> : v.fuel_type}</td>
                  <td>{editing === v.id ? <select value={v.owner_id || ''} onChange={(e) => { v.owner_id = e.target.value || null; setList([...list]) }}><option value="">-</option>{owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select> : (owners.find((o) => o.id === v.owner_id)?.name || v.owner_id || '-')}</td>
                  <td>{editing === v.id ? <select value={v.driver_id || ''} onChange={(e) => { v.driver_id = e.target.value || null; setList([...list]) }}><option value="">-</option>{drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select> : (drivers.find((d) => d.id === v.driver_id)?.name || v.driver_id || '-')}</td>
                  <td className="table-actions">
                    {editing === v.id ? (
                      <>
                        <button className="btn-secondary" type="button" onClick={() => saveEdit(v.id)}>Save</button>
                        <button className="btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button className="action-icon info" type="button" title="View details" onClick={() => setSelectedVehicle({ ...v, owner_name: owners.find(o => o.id === v.owner_id)?.name, driver_name: drivers.find(d => d.id === v.driver_id)?.name })}>👁️</button>
                        <button className="action-icon delete" type="button" title="Delete vehicle" onClick={() => deleteVehicle(v.id)}>🗑️</button>
                        <button className="action-icon edit" type="button" title="Edit vehicle" onClick={() => setEditing(v.id)}>✏️</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <VehicleModal vehicle={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
    </div>
  )
}
