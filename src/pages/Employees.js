import { useState, useEffect } from 'react';
import { getAssignments, createAssignment, deleteAssignment, getProducts, getDealers, getLivePunchCount } from '../services/api';
import { getAllAllocations } from '../services/api';
import { FiPlus, FiX, FiTrash2, FiCheck, FiMapPin, FiEdit2 } from 'react-icons/fi';

const Employees = () => {
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [punchData, setPunchData] = useState({ punchedInCount: 0, punchedOutCount: 0, punchedInUsers: [], punchedOutUsers: [] });

  const [form, setForm] = useState({ employeeId: '', dealerId: '', productIds: [], assignedDate: new Date().toISOString().split('T')[0], notes: '' });

  const fetchData = async () => {
    try {
      const [aRes, pRes] = await Promise.all([getAssignments(), getLivePunchCount()]);
      setAssignments(aRes.data);
      setPunchData(pRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const loadDropdowns = async () => {
    try {
      const [eRes, dRes, pRes] = await Promise.all([getAllAllocations(), getDealers({ limit: 200 }), getProducts({ limit: 200 })]);
      setEmployees(eRes.data);
      setDealers(dRes.data.dealers);
      setProducts(pRes.data.products);
    } catch (err) { console.error(err); }
  };

  const openCreate = async () => {
    await loadDropdowns();
    setEditing(null);
    setForm({ employeeId: '', dealerId: '', productIds: [], assignedDate: new Date().toISOString().split('T')[0], notes: '' });
    setShowPanel(true);
  };

  const openEdit = async (assignment) => {
    await loadDropdowns();
    setEditing(assignment);
    setForm({
      employeeId: assignment.employeeId || assignment.employee?.id || '',
      dealerId: assignment.dealerId || assignment.dealer?.id || '',
      productIds: (assignment.products || []).map(p => p.productId || p.product?.id).filter(Boolean),
      assignedDate: assignment.assignedDate || new Date().toISOString().split('T')[0],
      notes: assignment.notes || '',
    });
    setShowPanel(true);
  };

  const toggleProduct = (pid) => {
    setForm(prev => ({
      ...prev,
      productIds: prev.productIds.includes(pid) ? prev.productIds.filter(id => id !== pid) : [...prev.productIds, pid],
    }));
  };

  const handleSave = async () => {
    if (!form.employeeId || !form.dealerId || form.productIds.length === 0) {
      alert('Please select employee, dealer, and at least one product');
      return;
    }
    try {
      if (editing) {
        await deleteAssignment(editing.id);
      }
      await createAssignment(form);
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

      {/* Assignments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Employee</th><th>Dealer</th><th>Products</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.assignedDate}</td>
                <td style={{ fontWeight: 500 }}>{a.employee?.user?.name}</td>
                <td>{a.dealer?.businessName || a.dealer?.user?.name}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(a.products || []).map((ap, i) => (
                      <span key={i} className={`badge ${ap.saleStatus === 'submitted' ? 'badge-active' : ap.saleStatus === 'rejected' ? 'badge-inactive' : 'badge-pending'}`} style={{ fontSize: 11 }}>
                        {ap.product?.name} ({ap.saleStatus === 'submitted' ? 'Sold' : ap.saleStatus === 'rejected' ? 'Not Sold' : 'Pending'})
                      </span>
                    ))}
                  </div>
                </td>
                <td><span className={`badge badge-${a.status === 'completed' ? 'active' : a.status === 'in_progress' ? 'pending' : 'draft'}`}>{a.status}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => openEdit(a)} title="Edit"><FiEdit2 /></button>
                  <button className="icon-btn danger" onClick={() => handleDelete(a.id)} title="Delete"><FiTrash2 /></button>
                </td>
              </tr>
            ))}
            {assignments.length === 0 && <tr><td colSpan="6" style={{ textAlign: 'center' }}>No assignments yet. Click "Create Assignment" to assign employee → dealer → products.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create Assignment Panel */}
      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>{editing ? 'Edit Assignment' : 'Create Assignment'}</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            <div className="info-box" style={{ marginBottom: 16 }}>Assign an employee to visit a dealer with specific products</div>

            <div className="form-group">
              <label>Select Employee *</label>
              <select value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })}>
                <option value="">Choose employee...</option>
                {employees.map((e) => <option key={e.id} value={e.id}>{e.user?.name} ({e.designation || 'Employee'})</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Select Dealer *</label>
              <select value={form.dealerId} onChange={(e) => setForm({ ...form, dealerId: e.target.value })}>
                <option value="">Choose dealer...</option>
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.businessName} - {d.city}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Assigned Date</label>
              <input type="date" value={form.assignedDate} onChange={(e) => setForm({ ...form, assignedDate: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any instructions..." rows="2" style={{ width: '100%', background: '#0d1117', border: '1px solid #21262d', borderRadius: 6, padding: '8px 12px', color: '#e6edf3', fontSize: 14, resize: 'vertical' }} />
            </div>

            <div className="form-group">
              <label>Select Products * ({form.productIds.length} selected)</label>
              <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                {products.map((p) => {
                  const checked = form.productIds.includes(p.id);
                  return (
                    <div key={p.id}
                      onClick={() => toggleProduct(p.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                        background: checked ? 'rgba(63,185,80,0.1)' : '#0d1117',
                        border: `1px solid ${checked ? 'rgba(63,185,80,0.3)' : '#21262d'}`,
                        borderRadius: 6, cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 3,
                        border: `2px solid ${checked ? '#3fb950' : '#21262d'}`,
                        background: checked ? '#3fb950' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {checked && <FiCheck size={12} color="#fff" />}
                      </div>
                      <div>
                        <div style={{ color: '#e6edf3', fontSize: 13 }}>{p.name}</div>
                        <div style={{ color: '#8b949e', fontSize: 11 }}>{p.sku} | {p.category?.name}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
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
