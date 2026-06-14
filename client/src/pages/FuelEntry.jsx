import React, { useEffect, useState } from 'react'
import { api } from '../api'

export default function FuelEntry(){
  const [vehicles, setVehicles] = useState([])
  const [logs, setLogs] = useState([])
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0,10), vehicle_id:'', fuel_type:'CNG', litres:'', amount:'' })
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editData, setEditData] = useState({ litres:'', amount:'' })
  const [showModal, setShowModal] = useState(false)
  const [showView, setShowView] = useState(false)
  const [viewData, setViewData] = useState(null)

  useEffect(()=>{ load(); api.get('/vehicles').then(setVehicles).catch(()=>setVehicles([])) }, [])

  function load(){
    api.get('/fuel').then(setLogs).catch(()=>setLogs([]))
  }

  async function submit(e){
    e.preventDefault()
    if(!form.vehicle_id){ alert('Select a vehicle'); return }
    setLoading(true)
    try{
      const payload = { ...form, amount: Number(form.amount||0), litres: Number(form.litres||0) }
      const created = await api.post('/fuel', payload)
      // optimistic update: prepend created entry if API returns it, otherwise reload
      if(created && created.id){ setLogs(prev=>[created, ...prev]) } else { load() }
      setForm({...form, vehicle_id:'', litres:'', amount:''})
    }catch(err){ alert(err.error||JSON.stringify(err)) }
    setLoading(false)
  }

  const unitLabel = form.fuel_type === 'CNG' ? 'kgs' : 'Litres'

  return (
    <div className="container fuel-page">
      <div className="card">
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <h2 style={{margin:0}}>Fuel Entry</h2>
            <p style={{margin:'6px 0 0 0',color:'var(--muted)'}}>Log fuel quickly and review recent entries.</p>
          </div>
          <div className="cab-badge" style={{alignSelf:'flex-start'}}>
            <span>Fuel</span>
            <small>Quick log</small>
          </div>
        </div>
      </div>

      <div className="card fuel-card">
        <div className="fuel-body">
          <div>
            {/** Modal for logging fuel (triggered from top button or per-row buttons) */}
            {showModal && (
              <div className="modal-overlay" onClick={()=>setShowModal(false)}>
                <div className="modal-content" onClick={(e)=>e.stopPropagation()}>
                  <div className="modal-header">
                    <h2>Log Fuel</h2>
                    <button className="modal-close" onClick={()=>setShowModal(false)}>×</button>
                  </div>
                  <div className="modal-body">
                    <form onSubmit={async (e)=>{ await submit(e); setShowModal(false); }} className="form-grid">
                      <div className="form-group">
                        <label>Date</label>
                        <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label>Vehicle</label>
                        <select value={form.vehicle_id} onChange={e=>setForm({...form, vehicle_id:e.target.value})} required>
                          <option value="">Select vehicle</option>
                          {vehicles.map(v=> <option key={v.id} value={v.id}>{v.reg_no}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Fuel type</label>
                        <select value={form.fuel_type} onChange={e=>setForm({...form, fuel_type:e.target.value})}>
                          <option>CNG</option>
                          <option>Petrol</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Quantity</label>
                        <div className="input-with-badge">
                          <input placeholder={`Enter ${unitLabel}`} value={form.litres} onChange={e=>setForm({...form, litres:e.target.value})} type="number" step="0.1" />
                          <span className="unit-badge">{unitLabel}</span>
                        </div>
                      </div>
                      <div className="form-group form-amount">
                        <label>Amount (₹)</label>
                        <input placeholder="Amount spent" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} type="number" step="0.01" />
                      </div>

                      <div className="form-group form-submit">
                        <button className="btn-submit-large" type="submit" disabled={loading}>{loading? 'Logging...': 'Log Fuel'}</button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="fuel-summary">
            <div style={{marginBottom:12,display:'flex',alignItems:'center',gap:12}}>
              <button className="btn-submit-large log-top-button" onClick={()=>setShowModal(true)}>Log Fuel</button>
              <div style={{flex:1}} />
              <div className="summary-card" style={{flexBasis:360,flexShrink:0}}>
                <div className="summary-top">
                  <div>
                    <div className="summary-stat-label">Last fuel price</div>
                    <div className="summary-stat-value">{logs[0] ? `₹${Number(logs[0].amount).toFixed(2)}` : '-'}</div>
                    <div className="metric-note">{logs[0] ? `${logs[0].litres} ${logs[0].fuel_type==='CNG' ? 'kgs' : 'L'}` : ''}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{marginTop:12}}>
              <h4 style={{margin:'0 0 12px 0'}}>Fuel logs</h4>
                <div className="table-scroll">
                  <table className="table fuel-table">
                    <thead>
                      <tr>
                        <th style={{width:140}}>Date</th>
                        <th>Vehicle</th>
                        <th style={{width:120}}>Fuel</th>
                        <th style={{width:120}}>Qty</th>
                        <th style={{width:120}}>Amt</th>
                        <th className="actions" style={{width:150}}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map(l=> (
                        <tr key={l.id}>
                          <td>{l.date || l.timestamp || '-'}</td>
                          <td style={{fontWeight:700}}>{vehicles.find(v=>v.id===l.vehicle_id)?.reg_no || '-'}</td>
                          <td>{l.fuel_type}</td>
                          <td>{editingId===l.id ? <input type="number" step="0.1" value={editData.litres} onChange={e=>setEditData({...editData, litres:e.target.value})} style={{padding:8,borderRadius:8,width:100}} /> : (l.fuel_type==='CNG'? `${l.litres} kgs` : `${l.litres} L`)}</td>
                          <td>{editingId===l.id ? <input type="number" step="0.01" value={editData.amount} onChange={e=>setEditData({...editData, amount:e.target.value})} style={{padding:8,borderRadius:8,width:100}} /> : `₹${l.amount}`}</td>
                          <td className="table-actions">
                            {editingId===l.id ? (
                              <>
                                <button className="action-icon edit" onClick={async()=>{
                                  try{
                                    await api.put('/fuel/'+l.id, { ...l, litres: Number(editData.litres||0), amount: Number(editData.amount||0) })
                                    setEditingId(null); setEditData({ litres:'', amount:'' }); load()
                                  }catch(err){ alert(err.error||JSON.stringify(err)) }
                                }} title="Save">💾</button>
                                <button className="action-icon" onClick={()=>{ setEditingId(null); setEditData({ litres:'', amount:'' }) }} title="Cancel">✖️</button>
                              </>
                            ) : (
                              <>
                                <button className="action-icon info" onClick={()=>{ setShowModal(false); setViewData(l); setShowView(true); }} title="View">👁️</button>
                                <button className="action-icon log" onClick={()=>{ setShowModal(false); setViewData(l); setShowView(true); }} title="View details">⛽</button>
                                <button className="action-icon edit" onClick={()=>{ setEditingId(l.id); setEditData({ litres: l.litres, amount: l.amount }) }} title="Edit">✏️</button>
                                <button className="action-icon delete" onClick={async()=>{ if(window.confirm('Delete this fuel log?')){ try{ await api.delete('/fuel/'+l.id); load() }catch(err){ alert(err.error||JSON.stringify(err)) } } }} title="Delete">🗑️</button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/** View modal for a single fuel row */}
                {showView && viewData && (
                                  <div className="modal-overlay" onClick={()=>setShowView(false)} style={{zIndex:1100}}>
                                    <div className="modal-content" onClick={(e)=>e.stopPropagation()} style={{maxWidth:760}}>
                      <div className="modal-header">
                                        <div style={{display:'flex',alignItems:'center',gap:16}}>
                                          <div style={{width:72,height:56,display:'flex',alignItems:'center',justifyContent:'center',borderRadius:12,background: 'linear-gradient(135deg, rgba(223,128,220,0.12), rgba(214,85,211,0.08))',fontWeight:700,color:'var(--accent)'}}>Fuel</div>
                                          <div>
                                            <div style={{fontSize:20,fontWeight:900}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.reg_no || '-'}</div>
                                            <div style={{color:'var(--muted)',fontSize:13}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.owner_name || vehicles.find(v=>v.id===viewData.vehicle_id)?.driver_name || ''}</div>
                                          </div>
                                        </div>
                                        <button className="modal-close" onClick={()=>setShowView(false)}>×</button>
                                      </div>

                                      <div className="modal-body">
                                        <div className="detail-grid">
                                          <div>
                                            <div className="modal-label">Vehicle type</div>
                                            <div style={{fontWeight:800}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.vehicle_type || '-'}</div>
                                          </div>
                                          <div>
                                            <div className="modal-label">Fuel type</div>
                                            <div style={{fontWeight:800}}>{viewData.fuel_type}</div>
                                          </div>

                                          <div>
                                            <div className="modal-label">Owner</div>
                                            <div style={{fontWeight:800}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.owner_name || '-'}</div>
                                          </div>
                                          <div>
                                            <div className="modal-label">Driver</div>
                                            <div style={{fontWeight:800}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.driver_name || '-'}</div>
                                          </div>

                                          <div>
                                            <div className="modal-label">Registration number</div>
                                            <div style={{fontWeight:800}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.reg_no || '-'}</div>
                                          </div>
                                          <div>
                                            <div className="modal-label">Status</div>
                                            <div style={{fontWeight:800}}>{vehicles.find(v=>v.id===viewData.vehicle_id)?.status || 'Active'}</div>
                                          </div>

                                          <div>
                                            <div className="modal-label">Date</div>
                                            <div style={{fontWeight:700}}>{viewData.date || viewData.timestamp || '-'}</div>
                                          </div>
                                          <div>
                                            <div className="modal-label">Quantity</div>
                                            <div style={{fontWeight:800}}>{viewData.fuel_type==='CNG'? `${viewData.litres} kgs` : `${viewData.litres} L`}</div>
                                          </div>

                                          <div className="full-row">
                                            <div className="modal-label">Amount</div>
                                            <div style={{fontWeight:900,fontSize:24,color:'var(--text)'}}>₹{Number(viewData.amount).toFixed(2)}</div>
                                          </div>
                                        </div>

                                        <div style={{borderTop:'1px solid rgba(226,232,240,0.06)',marginTop:18,paddingTop:14,display:'flex',justifyContent:'flex-end'}}>
                                          <button className="btn-secondary" onClick={()=>setShowView(false)}>Close</button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                )}

              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
