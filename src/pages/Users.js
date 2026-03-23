import { useState, useEffect } from 'react';
import { getUsers, registerUser, updateUser, deleteUser } from '../services/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiUserPlus } from 'react-icons/fi';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'employee',
    businessName: '', city: '', state: '',
    designation: '', vehicleType: 'Personal Car (Sedan)', ratePerKm: 0.45,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await getUsers({ page, limit: 10, search, role: roleFilter || undefined });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page, search, roleFilter]);

  const openCreate = (role) => {
    setEditing(null);
    setError('');
    setForm({
      name: '', email: '', password: '', phone: '', role: role || 'employee',
      businessName: '', city: '', state: '',
      designation: '', vehicleType: 'Personal Car (Sedan)', ratePerKm: 0.45,
    });
    setShowPanel(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setError('');
    setForm({
      name: user.name, email: user.email, password: '', phone: user.phone || '', role: user.role,
      businessName: '', city: '', state: '',
      designation: '', vehicleType: 'Personal Car (Sedan)', ratePerKm: 0.45,
    });
    setShowPanel(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updateData = { name: form.name, phone: form.phone, status: form.status };
        await updateUser(editing.id, updateData);
      } else {
        if (!form.name || !form.email || !form.password) {
          setError('Name, Email and Password are required');
          setSaving(false);
          return;
        }
        await registerUser(form);
      }
      setShowPanel(false);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    }
    setSaving(false);
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this user?')) return;
    await deleteUser(id);
    fetchUsers();
  };

  if (loading) return <div className="loading">Loading users...</div>;

  const totalPages = Math.ceil(total / 10);

  return (
    <div>
      <h2 className="page-title">User Management</h2>
      <div className="toolbar">
        <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="filter-select">
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="dealer">Dealer</option>
          <option value="employee">Employee</option>
        </select>
        <button className="btn btn-primary" onClick={() => openCreate('employee')}><FiUserPlus /> Add Employee</button>
        <button className="btn btn-secondary" onClick={() => openCreate('dealer')}><FiPlus /> Add Dealer</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card" onClick={() => setRoleFilter('')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{total}</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setRoleFilter('employee')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Employees</span>
            <span className="stat-value" style={{ color: '#58a6ff' }}>{users.filter(u => u.role === 'employee').length}</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setRoleFilter('dealer')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Dealers</span>
            <span className="stat-value" style={{ color: '#3fb950' }}>{users.filter(u => u.role === 'dealer').length}</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setRoleFilter('admin')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Admins</span>
            <span className="stat-value" style={{ color: '#d29922' }}>{users.filter(u => u.role === 'admin').length}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.phone || '-'}</td>
                <td>
                  <span className={`badge badge-${u.role === 'admin' ? 'pending' : u.role === 'dealer' ? 'active' : 'shipped'}`}>
                    {u.role}
                  </span>
                </td>
                <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <button className="icon-btn" onClick={() => openEdit(u)}><FiEdit2 /></button>
                  {u.role !== 'admin' && (
                    <button className="icon-btn danger" onClick={() => handleDeactivate(u.id)}><FiTrash2 /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing {users.length} of {total} users</span>
          <div className="page-btns">
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel - Create/Edit User */}
      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>{editing ? 'Edit User' : `Add ${form.role === 'employee' ? 'Employee' : form.role === 'dealer' ? 'Dealer' : 'User'}`}</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            {error && <div className="alert alert-danger">{error}</div>}

            {!editing && (
              <div className="form-group">
                <label>Role *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="employee">Employee</option>
                  <option value="dealer">Dealer</option>
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
            </div>

            {!editing && (
              <>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email" />
                </div>
                <div className="form-group">
                  <label>Password *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone number" />
            </div>

            {/* Employee-specific fields */}
            {form.role === 'employee' && !editing && (
              <>
                <div style={{ borderTop: '1px solid #21262d', margin: '16px 0', paddingTop: 16 }}>
                  <span style={{ color: '#58a6ff', fontSize: 13, fontWeight: 600 }}>EMPLOYEE DETAILS</span>
                </div>
                <div className="form-group">
                  <label>Designation</label>
                  <input value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} placeholder="e.g., Field Sales Executive" />
                </div>
                <div className="form-group">
                  <label>Vehicle Type</label>
                  <select value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}>
                    <option value="Personal Car (Sedan)">Personal Car (Sedan)</option>
                    <option value="Two Wheeler">Two Wheeler</option>
                    <option value="Company Vehicle">Company Vehicle</option>
                    <option value="Public Transport">Public Transport</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Rate Per KM ($)</label>
                  <input type="number" step="0.01" value={form.ratePerKm} onChange={(e) => setForm({ ...form, ratePerKm: parseFloat(e.target.value) || 0 })} />
                </div>
              </>
            )}

            {/* Dealer-specific fields */}
            {form.role === 'dealer' && !editing && (
              <>
                <div style={{ borderTop: '1px solid #21262d', margin: '16px 0', paddingTop: 16 }}>
                  <span style={{ color: '#3fb950', fontSize: 13, fontWeight: 600 }}>DEALER DETAILS</span>
                </div>
                <div className="form-group">
                  <label>Business Name</label>
                  <input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Business name" />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
                </div>
              </>
            )}

            <div className="panel-footer">
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : editing ? 'Update' : `Create ${form.role === 'employee' ? 'Employee' : form.role === 'dealer' ? 'Dealer' : 'User'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
