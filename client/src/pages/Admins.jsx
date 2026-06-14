import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../AuthContext'
import { api } from '../api'

const ROLE_OPTIONS = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'fleet_admin', label: 'Fleet Admin' },
  { value: 'finance_admin', label: 'Finance Admin' },
  { value: 'operations_admin', label: 'Operations Admin' },
  { value: 'viewer', label: 'Viewer' },
]

export default function Admins() {
  const { user } = useContext(AuthContext)
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', admin_level: 'fleet_admin', super_password: '' })

  useEffect(() => {
    // Only super_admin can access this page
    if (!(user?.role === 'admin' && user?.admin_level === 'super_admin')) {
      return
    }
    api.get('/admins')
      .then(setAdmins)
      .catch(() => setAdmins([]))
      .finally(() => setLoading(false))
  }, [user])

  function handleAddAdmin(e) {
    e.preventDefault()
    if (!form.username || !form.password || !form.super_password) {
      alert('Username, password and your (super admin) password are required')
      return
    }
    api.post('/admins', { username: form.username, password: form.password, admin_level: form.admin_level, super_password: form.super_password })
      .then(() => {
        api.get('/admins').then(setAdmins)
        setForm({ username: '', password: '', admin_level: 'fleet_admin', super_password: '' })
        setShowAddModal(false)
        alert('Admin created successfully')
      })
      .catch((err) => alert(err.error || 'Error creating admin'))
  }

  function handleDeleteAdmin(id) {
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      api.delete(`/admins/${id}`)
        .then(() => {
          api.get('/admins').then(setAdmins)
          alert('Admin deleted')
        })
        .catch((err) => alert(err.error || 'Error deleting admin'))
    }
  }

  const ROLE_ORDER = ['viewer','operations_admin','finance_admin','fleet_admin','super_admin']

  function handleChangeLevel(id, newRole) {
    api.put(`/admins/${id}`, { admin_level: newRole })
      .then(() => {
        api.get('/admins').then(setAdmins)
        alert('Admin role updated')
      })
      .catch((err) => alert(err.error || 'Error updating admin'))
  }

  async function handlePromoteDemote(id, action){
    const admin = admins.find(a=>a.id===id)
    if(!admin) return
    const idx = ROLE_ORDER.indexOf(admin.admin_level || 'viewer')
    if(action === 'promote'){
      if(idx >= ROLE_ORDER.length-1){ alert('Already highest role'); return }
      const newRole = ROLE_ORDER[idx+1]
      try{ await api.put(`/admins/${id}`, { admin_level: newRole }); api.get('/admins').then(setAdmins); alert('Admin promoted to '+newRole) }catch(err){ alert(err.error||'Error promoting') }
    } else {
      if(idx <= 0){ alert('Already lowest role'); return }
      const newRole = ROLE_ORDER[idx-1]
      // prevent demoting the only super_admin? add check server-side ideally
      if(admin.admin_level === 'super_admin'){ alert('Cannot demote a super admin'); return }
      try{ await api.put(`/admins/${id}`, { admin_level: newRole }); api.get('/admins').then(setAdmins); alert('Admin demoted to '+newRole) }catch(err){ alert(err.error||'Error demoting') }
    }
  }

  function handleDeleteAdmin(id) {
    const admin = admins.find(a=>a.id===id)
    if(admin?.admin_level === 'super_admin'){
      alert('Super Admin cannot be deleted')
      return
    }
    if (window.confirm('Are you sure? This action cannot be undone.')) {
      api.delete(`/admins/${id}`)
        .then(() => {
          api.get('/admins').then(setAdmins)
          alert('Admin deleted')
        })
        .catch((err) => alert(err.error || 'Error deleting admin'))
    }
  }

  if (!(user?.role === 'admin' && user?.admin_level === 'super_admin')) {
    return (
      <div className="card">
        <h2>Access Denied</h2>
        <p className="muted">Only super admins can manage admin users.</p>
      </div>
    )
  }

  return (
    <div className="container admins-page">
      <div className="card">
        <div className="section-header">
          <div>
            <h2 style={{ margin: 0 }}>Admin Management</h2>
            <p className="muted">Create and manage admin user accounts.</p>
          </div>
          <button className="btn-submit" onClick={() => setShowAddModal(true)}>+ Add Admin</button>
        </div>
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Admin</h3>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleAddAdmin} className="form-grid">
                <div className="form-group">
                  <label>Username <span className="required">*</span></label>
                  <input placeholder="Admin username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Password <span className="required">*</span></label>
                  <input type="password" placeholder="Strong password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Admin Role</label>
                  <select value={form.admin_level} onChange={(e) => setForm({ ...form, admin_level: e.target.value })}>
                    {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Confirm your password (Super Admin) <span className="required">*</span></label>
                  <input type="password" placeholder="Enter your super admin password" value={form.super_password} onChange={(e) => setForm({ ...form, super_password: e.target.value })} required />
                </div>
                <button className="btn-submit-large" type="submit">Create Admin</button>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="card">
      <h3>Current Admins</h3>
      {loading ? (
        <p className="muted">Loading admins...</p>
      ) : admins.length === 0 ? (
        <p className="muted">No admin users found.</p>
      ) : (
        <div className="admins-list">
          <div className="admin-cards">
            {admins.map((admin) => (
              <div className={`admin-card ${'role-'+(admin.admin_level||'viewer')}`} key={admin.id}>
                <div className="admin-top">
                  <div className="admin-avatar">{(admin.username||'U').slice(0,2).toUpperCase()}</div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,fontSize:16}}>{admin.username}</div>
                    <div style={{color:'var(--muted)',fontSize:13}}>{admin.email || ''}</div>
                  </div>
                  <div style={{marginLeft:12,display:'flex',flexDirection:'column',gap:8}}>
                    <div className={`role-badge role-${admin.admin_level||'viewer'}`}>{ROLE_OPTIONS.find(r=>r.value===admin.admin_level)?.label || 'Viewer'}</div>
                  </div>
                </div>

                <div className="admin-actions">
                  <div className="action-group">
                    <button title="Promote" className="action-ctrl" onClick={()=>handlePromoteDemote(admin.id,'promote')} disabled={admin.admin_level==='super_admin'}>{admin.admin_level==='super_admin' ? '⬆️' : '⬆️'}</button>
                    <button title="Demote" className="action-ctrl" onClick={()=>handlePromoteDemote(admin.id,'demote')} disabled={admin.admin_level==='super_admin'}>{admin.admin_level==='super_admin' ? '⬇️' : '⬇️'}</button>
                  </div>
                  <div className="action-group">
                    <select value={admin.admin_level || 'viewer'} onChange={(e)=>handleChangeLevel(admin.id,e.target.value)} disabled={admin.admin_level==='super_admin'} title={admin.admin_level==='super_admin' ? 'Super Admin role is managed by developers' : 'Change role'}>
                      {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {admin.admin_level !== 'super_admin' && (
                      <button className="btn-delete" onClick={()=>handleDeleteAdmin(admin.id)}>Delete</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
