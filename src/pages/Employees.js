import { useState, useEffect, useRef } from 'react';
import { getAssignments, createAssignment, deleteAssignment, getDealers, getLivePunchCount } from '../services/api';
import { getAllAllocations } from '../services/api';
import { FiPlus, FiX, FiTrash2, FiMapPin, FiEdit2, FiSearch, FiChevronDown } from 'react-icons/fi';

const Employees = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [punchData, setPunchData] = useState({ punchedInCount: 0, punchedOutCount: 0, punchedInUsers: [], punchedOutUsers: [] });
  const [viewDealersModal, setViewDealersModal] = useState(null);

  const [form, setForm] = useState({ employeeId: '', dealerIds: [], assignedDate: new Date().toISOString().split('T')[0], notes: '' });
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false);
  const [dealerSearch, setDealerSearch] = useState('');
  const dealerDropRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => { if (dealerDropRef.current && !dealerDropRef.current.contains(e.target)) setDealerDropdownOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([getAssignments(), getLivePunchCount()]);
      setAssignments(aRes.data);
      setPunchData(pRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // Auto-refresh every 30 seconds for live punch status
  useEffect(() => {
    const interval = setInterval(() => { fetchData(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDropdowns = async () => {
    try {
      const [eRes, dRes] = await Promise.all([getAllAllocations(), getDealers({ limit: 200 })]);
      setEmployees(eRes.data);
      setDealers(dRes.data.dealers);
    } catch (err) { console.error(err); }
  };

  const openCreate = async () => {
    await loadDropdowns();
    setEditing(null);
    setForm({ employeeId: '', dealerIds: [], assignedDate: new Date().toISOString().split('T')[0], notes: '' });
    setShowPanel(true);
  };

  const openEdit = async (assignment) => {
    await loadDropdowns();
    setEditing(assignment);
    setForm({
      employeeId: assignment.employeeId || assignment.employee?.id || '',
      dealerIds: [assignment.dealerId || assignment.dealer?.id].filter(Boolean),
      assignedDate: assignment.assignedDate || new Date().toISOString().split('T')[0],
      notes: assignment.notes || '',
    });
    setShowPanel(true);
  };

  const toggleDealer = (did) => {
    setForm(prev => ({
      ...prev,
      dealerIds: prev.dealerIds.includes(did) ? prev.dealerIds.filter(id => id !== did) : [...prev.dealerIds, did],
    }));
  };

  const handleSave = async () => {
    if (!form.employeeId || form.dealerIds.length === 0) {
      alert('Please select employee and at least one dealer');
      return;
    }
    try {
      if (editing) {
        await deleteAssignment(editing.id);
      }
      // Create one assignment per dealer
      for (const dealerId of form.dealerIds) {
        await createAssignment({ ...form, dealerId });
      }
      setShowPanel(false);
      setEditing(null);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    await deleteAssignment(id);
    fetchData();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2 className="page-title">Employee Assignment</h2>

      {/* Live Punch Status */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Punched In (Live)</span>
            <span className="stat-value" style={{ color: '#3fb950' }}>{punchData.punchedInCount}</span>
          </div>
          <div className="stat-icon" style={{ color: '#3fb950' }}><FiMapPin size={24} /></div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Punched Out Today</span>
            <span className="stat-value" style={{ color: '#8b949e' }}>{punchData.punchedOutCount}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Total Assignments</span>
            <span className="stat-value">{assignments.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ color: '#58a6ff' }}>{assignments.filter(a => a.status === 'completed').length}</span>
          </div>
        </div>
      </div>

      {/* Punched In Users */}
      {punchData.punchedInUsers.length > 0 && (
        <div className="chart-card" style={{ marginBottom: 16 }}>
          <h3 style={{ color: '#3fb950' }}>Currently Punched In</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {punchData.punchedInUsers.map((a, i) => (
              <div key={i} style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)', borderRadius: 8, padding: '8px 14px' }}>
                <span style={{ color: '#3fb950', fontWeight: 500, fontSize: 13 }}>{a.employee?.user?.name}</span>
                <br/>
                <span style={{ color: '#8b949e', fontSize: 11 }}>In: {new Date(a.punchIn).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="toolbar">
        <button className="btn btn-primary" onClick={openCreate}><FiPlus /> Create Assignment</button>
      </div>

      {/* Assignments Table - Grouped by Employee + Date */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Employee</th><th>Dealers</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {(() => {
              const grouped = {};
              assignments.forEach(a => {
                const key = `${a.assignedDate}_${a.employee?.id}`;
                if (!grouped[key]) grouped[key] = { date: a.assignedDate, employee: a.employee, items: [] };
                grouped[key].items.push(a);
              });
              const rows = Object.values(grouped);
              if (rows.length === 0) return <tr><td colSpan="5" style={{ textAlign: 'center' }}>No assignments yet. Click "Create Assignment" to assign employee → dealer.</td></tr>;
              return rows.map((group, gi) => {
                const first = group.items[0];
                const firstDealer = first.dealer?.businessName || first.dealer?.user?.name || '-';
                const totalDealers = group.items.length;
                const completedCount = group.items.filter(a => a.status === 'completed').length;
                const overallStatus = completedCount === totalDealers ? 'completed' : completedCount > 0 ? 'in_progress' : 'pending';
                return (
                  <tr key={gi}>
                    <td>{group.date}</td>
                    <td style={{ fontWeight: 500 }}>{group.employee?.user?.name}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span className="badge badge-shipped" style={{ fontSize: 11 }}>{firstDealer}</span>
                        {totalDealers > 1 && (
                          <button
                            onClick={() => setViewDealersModal(group)}
                            style={{
                              background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                              borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            +{totalDealers - 1} more
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${overallStatus === 'completed' ? 'active' : overallStatus === 'in_progress' ? 'pending' : 'draft'}`}>
                        {completedCount}/{totalDealers} done
                      </span>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => setViewDealersModal(group)} title="View All"><FiEdit2 /></button>
                      <button className="icon-btn danger" onClick={async () => { if (!window.confirm(`Delete all ${totalDealers} assignments for ${group.employee?.user?.name}?`)) return; for (const a of group.items) await deleteAssignment(a.id); fetchData(); }} title="Delete All"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>

      {/* View Dealers Modal */}
      {viewDealersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewDealersModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 500, maxWidth: '90%', maxHeight: '80vh', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a2e' }}>Assigned Dealers</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  {viewDealersModal.employee?.user?.name} — {viewDealersModal.date}
                </p>
              </div>
              <button onClick={() => setViewDealersModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}>&times;</button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', maxHeight: '60vh' }}>
              {viewDealersModal.items.map((a, i) => {
                const dealerName = a.dealer?.businessName || a.dealer?.user?.name || '-';
                const isDone = a.status === 'completed';
                return (
                  <div key={a.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8,
                    background: isDone ? '#ecfdf5' : '#f9fafb', borderRadius: 10,
                    border: `1px solid ${isDone ? 'rgba(5,150,105,0.2)' : '#e5e7eb'}`,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isDone ? 'rgba(5,150,105,0.1)' : 'rgba(79,70,229,0.1)',
                      color: isDone ? '#059669' : '#4f46e5', fontWeight: 700, fontSize: 14,
                    }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, color: '#1a1a2e', fontSize: 14 }}>{dealerName}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{a.dealer?.city}{a.dealer?.state ? `, ${a.dealer.state}` : ''}</div>
                    </div>
                    <span className={`badge badge-${isDone ? 'active' : a.status === 'in_progress' ? 'pending' : 'draft'}`} style={{ fontSize: 11 }}>
                      {a.status}
                    </span>
                    <button className="icon-btn danger" onClick={async () => { await deleteAssignment(a.id); setViewDealersModal(prev => ({ ...prev, items: prev.items.filter(x => x.id !== a.id) })); fetchData(); if (viewDealersModal.items.length <= 1) setViewDealersModal(null); }} title="Delete"><FiTrash2 size={14} /></button>
                  </div>
                );
              })}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setViewDealersModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Assignment Panel */}
      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>{editing ? 'Edit Assignment' : 'Create Assignment'}</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            <div className="info-box" style={{ marginBottom: 16 }}>Assign an employee to visit a dealer</div>

            <div className="form-group">
              <label>Select Employee *</label>
              <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Choose employee...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.user?.name} ({e.designation || 'Employee'})</option>)}
              </select>
            </div>

            <div className="form-group" ref={dealerDropRef}>
              <label>Select Dealers * ({form.dealerIds.length} selected)</label>
              {/* Dropdown trigger */}
              <div
                onClick={() => setDealerDropdownOpen(!dealerDropdownOpen)}
                style={{
                  padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff', minHeight: 38,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                  {form.dealerIds.length === 0 ? (
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>Choose dealers...</span>
                  ) : (
                    form.dealerIds.map(did => {
                      const dl = dealers.find(d => d.id === did);
                      return dl ? (
                        <span key={did} style={{
                          background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          {dl.businessName}
                          <span onClick={(e) => { e.stopPropagation(); toggleDealer(did); }}
                            style={{ cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>&times;</span>
                        </span>
                      ) : null;
                    })
                  )}
                </div>
                <FiChevronDown size={16} style={{ color: '#9ca3af', transform: dealerDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
              </div>

              {/* Dropdown panel */}
              {dealerDropdownOpen && (
                <div style={{
                  border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, background: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden', position: 'relative', zIndex: 50,
                }}>
                  {/* Search */}
                  <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f9fafb', borderRadius: 6, padding: '6px 8px', border: '1px solid #e5e7eb' }}>
                      <FiSearch size={14} style={{ color: '#9ca3af' }} />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search dealer name..."
                        value={dealerSearch}
                        onChange={(e) => setDealerSearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, color: '#1a1a2e' }}
                      />
                    </div>
                  </div>
                  {/* Checkbox list */}
                  <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                    {dealers
                      .filter(d => !dealerSearch || (d.businessName || '').toLowerCase().includes(dealerSearch.toLowerCase()) || (d.city || '').toLowerCase().includes(dealerSearch.toLowerCase()))
                      .map(d => {
                        const checked = form.dealerIds.includes(d.id);
                        return (
                          <div key={d.id}
                            onClick={() => toggleDealer(d.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                              cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                              background: checked ? 'rgba(79,70,229,0.05)' : 'transparent',
                            }}
                            onMouseEnter={(e) => { if (!checked) e.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = checked ? 'rgba(79,70,229,0.05)' : 'transparent'; }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                              border: `2px solid ${checked ? '#4f46e5' : '#d1d5db'}`,
                              background: checked ? '#4f46e5' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
                            </div>
                            <div>
                              <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 500 }}>{d.businessName}</div>
                              <div style={{ color: '#9ca3af', fontSize: 11 }}>{d.city}{d.state ? `, ${d.state}` : ''}</div>
                            </div>
                          </div>
                        );
                      })}
                    {dealers.filter(d => !dealerSearch || (d.businessName || '').toLowerCase().includes(dealerSearch.toLowerCase())).length === 0 && (
                      <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No dealers found</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Assigned Date</label>
              <input type="date" value={form.assignedDate} min={new Date().toISOString().split('T')[0]} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any instructions..." rows="2" style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3', fontSize: 14, resize: 'vertical' }} />
            </div>

            <div className="panel-footer">
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editing ? 'Update Assignment' : 'Create Assignment'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
