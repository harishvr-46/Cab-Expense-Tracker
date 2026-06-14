import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function Drivers() {
  const [list, setList] = useState([])
  const [form, setForm] = useState({ name: '', licence: '', profile_picture: '', aadhaar: '', pan: '', pvc_status: '', address: '', contact_number: '', family_contact_number: '', emergency_contact: '', notes: '' })
  const [editing, setEditing] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => { api.get('/drivers').then(setList).catch(() => setList([])) }, [])

  function submit(e) {
    e.preventDefault()
    api.post('/drivers', form)
      .then(()=> { api.get('/drivers').then(setList); setForm({ name: '', licence: '', profile_picture: '', aadhaar: '', pan: '', pvc_status: '', address: '', contact_number: '', family_contact_number: '', emergency_contact: '', notes: '' }) })
      .catch((err)=>alert(err.error || JSON.stringify(err)))
  }

  function saveEdit(id){
    const d = list.find(x=>x.id===id)
    api.put('/drivers/'+id, d).then(()=>{ setEditing(null); api.get('/drivers').then(setList) }).catch(err=>alert(err.error||JSON.stringify(err)))
  }

  function handleDropImage(file){
    const reader = new FileReader()
    reader.onload = (ev) => setForm({...form, profile_picture: ev.target.result})
    reader.readAsDataURL(file)
  }

  return (
    <div className="container">
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:16}}>
          <div>
            <h2 style={{margin:0}}>Drivers</h2>
            <p style={{margin:0,color:'var(--muted)'}}>Add and manage drivers — keep profiles up to date.</p>
          </div>
          <div style={{minWidth:160, textAlign:'right'}}>
            <button className="btn-submit-large" onClick={(e)=>{e.preventDefault(); setShowAddModal(true);}}>Add driver</button>
          </div>
        </div>
      </div>
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Driver</h2>
              <button className="modal-close" onClick={()=>setShowAddModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <form onSubmit={(e)=>{ submit(e); setShowAddModal(false); }} className="form-grid">
                <div className="form-group">
                  <label>Name <span className="required">*</span></label>
                  <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Licence</label>
                  <input placeholder="Licence" value={form.licence} onChange={e=>setForm({...form, licence:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Profile picture</label>
                  <div style={{border:'2px dashed #e6eefc',padding:12,borderRadius:12,display:'flex',alignItems:'center',gap:12,flexDirection:'column'}} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault(); const f = e.dataTransfer.files && e.dataTransfer.files[0]; if(f) handleDropImage(f)}}>
                    {form.profile_picture ? <img src={form.profile_picture} style={{width:120,height:120,objectFit:'cover',borderRadius:10}} /> : <div style={{color:'var(--muted)'}}>Drop image here or click to choose</div>}
                    <input type="file" accept="image/*" onChange={(e)=>{ const f = e.target.files && e.target.files[0]; if(f) handleDropImage(f) }} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Contact number</label>
                  <input placeholder="Mobile" value={form.contact_number} onChange={e=>setForm({...form, contact_number:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Aadhaar</label>
                  <input value={form.aadhaar} onChange={e=>setForm({...form, aadhaar:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>PAN</label>
                  <input value={form.pan} onChange={e=>setForm({...form, pan:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>PVC status</label>
                  <input value={form.pvc_status} onChange={e=>setForm({...form, pvc_status:e.target.value})} />
                </div>
                <div className="form-group form-100">
                  <label>Address</label>
                  <input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Family contact</label>
                  <input value={form.family_contact_number} onChange={e=>setForm({...form, family_contact_number:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Emergency contact</label>
                  <input value={form.emergency_contact} onChange={e=>setForm({...form, emergency_contact:e.target.value})} />
                </div>
                <div className="form-group form-100">
                  <label>Notes</label>
                  <input value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} />
                </div>
                <div className="form-group" style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{flex:1}} />
                  <button className="btn-submit-large" type="submit">Save driver</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <h3 style={{marginTop:0}}>Driver Directory</h3>
        <div className="table-scroll">
          <table className="table">
            <thead><tr><th>Profile</th><th>Name</th><th>Licence</th><th>Contact</th><th className="actions">Actions</th></tr></thead>
            <tbody>
              {list.map(d => (
                <tr key={d.id}>
                  <td className="profile-cell">
                    {d.profile_picture ? <img className="profile-img" src={d.profile_picture} alt="avatar" /> : <div className="profile-placeholder">No pic</div>}
                  </td>
                  <td>{editing===d.id ? <input value={d.name} onChange={e=>{ d.name = e.target.value; setList([...list]) }} /> : d.name}</td>
                  <td>{editing===d.id ? <input value={d.licence} onChange={e=>{ d.licence = e.target.value; setList([...list]) }} /> : d.licence}</td>
                  <td>{editing===d.id ? <input value={d.contact_number || ''} onChange={e=>{ d.contact_number = e.target.value; setList([...list]) }} /> : (d.contact_number || '-')}</td>
                  <td className="table-actions">{editing===d.id ? <><button className="action-icon edit" onClick={()=>saveEdit(d.id)} title="Save">💾</button><button className="action-icon" onClick={()=>setEditing(null)} title="Cancel">✖️</button></> : <><button className="action-icon edit" onClick={()=>setEditing(d.id)} title="Edit">✏️</button><button className="action-icon delete" onClick={()=>{ if(window.confirm('Delete driver?')){ api.delete('/drivers/'+d.id).then(()=>api.get('/drivers').then(setList)) } }} title="Delete">🗑️</button></>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
