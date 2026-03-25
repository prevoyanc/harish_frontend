import { useState, useEffect } from 'react';
import { getDealers, updateDealer, registerUser, deleteDealer } from '../services/api';
import { FiPlus, FiX, FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'dealer', businessName: '', city: '', state: '' });
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const fetchDealers = async () => {
    try {
      const res = await getDealers({ page, limit: 10, search, tier: tierFilter || undefined });
      setDealers(res.data.dealers);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchDealers(); }, [page, search, tierFilter]);

  const handleTierChange = async (dealer, newTier) => {
    await updateDealer(dealer.id, { tier: newTier });
    fetchDealers();
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', email: '', password: '', phone: '', role: 'dealer', businessName: '', city: '', state: '' });
    setError('');
    setShowPanel(true);
  };

  const openEdit = (dealer) => {
    setEditing(dealer);
    setForm({
      name: dealer.user?.name || '',
      email: dealer.user?.email || '',
      password: '',
      phone: dealer.user?.phone || '',
      role: 'dealer',
      businessName: dealer.businessName || '',
      city: dealer.city || '',
      state: dealer.state || '',
    });
    setError('');
    setShowPanel(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateDealer(editing.id, {
          name: form.name,
          phone: form.phone,
          businessName: form.businessName,
          city: form.city,
          state: form.state,
        });
      } else {
        if (!form.name || !form.email) {
          setError('Name and Email are required');
          setSaving(false);
          return;
        }
        await registerUser(form);
      }
      setShowPanel(false);
      setEditing(null);
      fetchDealers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save dealer');
    }
    setSaving(false);
  };

  const handleDelete = async (dealer) => {
    if (!window.confirm(`Deactivate dealer "${dealer.businessName}"?`)) return;
    try {
      await deleteDealer(dealer.id);
      fetchDealers();
    } catch (err) { console.error(err); }
  };

  const handleActivate = async (dealer) => {
    if (!window.confirm(`Activate dealer "${dealer.businessName}"?`)) return;
    try {
      await updateDealer(dealer.id, { status: 'active' });
      fetchDealers();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="loading">Loading dealers...</div>;

  return (
    <div>
      <h2 className="page-title">Dealer Management</h2>
      <div className="toolbar">
        <input type="text" placeholder="Search business name..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <select value={tierFilter} onChange={(e) => setTierFilter(e.target.value)} className="filter-select">
          <option value="">All Tiers</option>
          <option value="gold">Gold</option>
          <option value="silver">Silver</option>
          <option value="bronze">Bronze</option>
        </select>
        <button className="btn btn-primary" onClick={openAdd}><FiPlus /> Add Dealer</button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Business Name</th><th>Contact</th><th>Username</th><th>Password</th><th>City</th><th>State</th><th>Tier</th><th>Points</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {dealers.map((d) => (
              <tr key={d.id}>
                <td>{d.businessName}</td>
                <td>{d.user?.name || '-'}<br/><small style={{color:'#9ca3af'}}>{d.user?.phone || ''}</small></td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{d.user?.email || '-'}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                      {visiblePasswords[d.id] ? (d.user?.plainPassword || '••••••••') : '••••••••'}
                    </span>
                    <button onClick={() => setVisiblePasswords(prev => ({ ...prev, [d.id]: !prev[d.id] }))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4f46e5', fontSize: 11 }}>
                      {visiblePasswords[d.id] ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </td>
                <td>{d.city || '-'}</td>
                <td>{d.state || '-'}</td>
                <td>
                  <select value={d.tier} onChange={(e) => handleTierChange(d, e.target.value)} style={{ background: d.tier === 'gold' ? '#d97706' : d.tier === 'silver' ? '#6b7280' : '#cd7f32', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 8px' }}>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="bronze">Bronze</option>
                  </select>
                </td>
                <td style={{fontWeight:600}}>{d.totalPoints?.toLocaleString()} pts</td>
                <td><span className={`badge badge-${d.user?.status || 'active'}`}>{d.user?.status || 'active'}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => openEdit(d)} title="Edit"><FiEdit2 /></button>
                  {d.user?.status === 'active' ? (
                    <button className="icon-btn danger" onClick={() => handleDelete(d)} title="Deactivate"><FiTrash2 /></button>
                  ) : (
                    <button className="icon-btn" onClick={() => handleActivate(d)} title="Activate" style={{ color: '#059669' }}><FiCheckCircle /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Total: {total} dealers</span>
        </div>
      </div>

      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>{editing ? 'Edit Dealer' : 'Add Dealer'}</h3>
            <button className="icon-btn" onClick={() => { setShowPanel(false); setEditing(null); }}><FiX /></button>
          </div>
          <div className="panel-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact person name" />
            </div>
            {!editing && (
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="dealer@email.com" />
              </div>
            )}
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            </div>
            <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0', paddingTop: 16 }}>
              <span style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>DEALER DETAILS</span>
            </div>
            <div className="form-group">
              <label>Business Name</label>
              <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Business / Shop name" />
            </div>
            <div className="form-group">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
            </div>
            <div className="form-group">
              <label>State</label>
              <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
            </div>
            <div className="panel-footer">
              <button className="btn btn-secondary" onClick={() => { setShowPanel(false); setEditing(null); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update Dealer' : 'Create Dealer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
