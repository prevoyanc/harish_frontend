import { useState, useEffect } from 'react';
import { getRewardCatalog, createReward, updateReward, deleteReward, getRedemptions, updateRedemptionStatus } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiXCircle } from 'react-icons/fi';

const Redemption = () => {
  const [tab, setTab] = useState('catalog');
  const [rewards, setRewards] = useState([]);
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', pointsRequired: 0, stock: 0, status: 'active' });

  const fetchData = async () => {
    try {
      const [rRes, rdRes] = await Promise.all([getRewardCatalog(), getRedemptions()]);
      setRewards(rRes.data);
      setRedemptions(rdRes.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', category: '', pointsRequired: 0, stock: 0, status: 'active' });
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({ name: r.name, category: r.category, pointsRequired: r.pointsRequired, stock: r.stock, status: r.status });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (editing) await updateReward(editing.id, form);
    else await createReward(form);
    setShowForm(false);
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reward?')) return;
    await deleteReward(id);
    fetchData();
  };

  const handleRedemptionAction = async (id, status) => {
    await updateRedemptionStatus(id, { status });
    fetchData();
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h2 className="page-title">Redemption Management</h2>
      <div className="tabs">
        <button className={`tab ${tab === 'catalog' ? 'active' : ''}`} onClick={() => setTab('catalog')}>Reward Catalog</button>
        <button className={`tab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Redemption Requests</button>
      </div>

      {tab === 'catalog' && (
        <div>
          <div className="toolbar">
            <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Reward</button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Category</th><th>Points Required</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rewards.map((r) => (
                  <tr key={r.id}>
                    <td>{r.name}</td>
                    <td>{r.category}</td>
                    <td>{r.pointsRequired.toLocaleString()} pts</td>
                    <td>{r.stock}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td>
                      <button className="icon-btn" onClick={() => openEdit(r)}><FiEdit2 /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(r.id)}><FiTrash2 /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {showForm && (
            <div className="side-panel">
              <div className="panel-header">
                <h3>{editing ? 'Edit Reward' : 'Add Reward'}</h3>
                <button className="icon-btn" onClick={() => setShowForm(false)}><FiX /></button>
              </div>
              <div className="panel-body">
                <div className="form-group"><label>Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select</option>
                    <option value="Gold">Gold</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Tours">Tours</option>
                    <option value="Gift Cards">Gift Cards</option>
                  </select>
                </div>
                <div className="form-group"><label>Points Required *</label><input type="number" value={form.pointsRequired} onChange={(e) => setForm({ ...form, pointsRequired: parseInt(e.target.value) || 0 })} /></div>
                <div className="form-group"><label>Stock</label><input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} /></div>
                <div className="panel-footer">
                  <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave}>Save</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Dealer</th><th>Reward</th><th>Points</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {redemptions.map((r) => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>{r.dealer?.user?.name || '-'}</td>
                  <td>{r.reward?.name || '-'}</td>
                  <td>{r.pointsSpent?.toLocaleString()} pts</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    {r.status === 'requested' && (
                      <>
                        <button className="btn btn-sm" style={{ background: '#3fb950', marginRight: 4 }} onClick={() => handleRedemptionAction(r.id, 'approved')}><FiCheck /> Approve</button>
                        <button className="btn btn-sm" style={{ background: '#f85149' }} onClick={() => handleRedemptionAction(r.id, 'rejected')}><FiXCircle /> Reject</button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleRedemptionAction(r.id, 'fulfilled')}><FiCheck /> Fulfill</button>
                    )}
                    {(r.status === 'fulfilled' || r.status === 'rejected') && <span style={{ color: '#8b949e' }}>-</span>}
                  </td>
                </tr>
              ))}
              {redemptions.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center' }}>No redemption requests</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Redemption;
