import { useState, useEffect } from 'react';
import { getDealers, updateDealer, registerUser } from '../services/api';
import { FiPlus, FiX } from 'react-icons/fi';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', role: 'dealer', businessName: '', city: '', state: '' });
  const [createdPasswords, setCreatedPasswords] = useState({});
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
    setForm({ name: '', email: '', password: '', phone: '', role: 'dealer', businessName: '', city: '', state: '' });
    setError('');
    setShowPanel(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Name, Email and Password are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await registerUser(form);
      const newEmail = form.email;
      const newPass = form.password;
      setCreatedPasswords(prev => ({ ...prev, [newEmail]: newPass }));
      setShowPanel(false);
      fetchDealers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create dealer');
    }
    setSaving(false);
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
            <tr><th>Business Name</th><th>Contact</th><th>Username</th><th>Password</th><th>City</th><th>State</th><th>Tier</th><th>Points</th><th>Status</th></tr>
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
            <h3>Add Dealer</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact person name" />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="dealer@email.com" />
            </div>
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
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Creating...' : 'Create Dealer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
