import { useState, useEffect, useCallback } from 'react';
import { getUsers, getUserRoleDropdown, registerUser, updateUser, deleteUser, activateUser } from '../services/api';
import { FiEdit2, FiTrash2, FiX, FiUserPlus, FiLock, FiCheckCircle } from 'react-icons/fi';

const fallbackRoleOptions = [
  { label: 'Employee', value: 'employee' },
  { label: 'Dealer', value: 'dealer' },
  { label: 'Retailer', value: 'retailer' },
  { label: 'Farmer', value: 'farmer' },
];

const normalizeRoleOptions = (data) => {
  const list = data?.roles || data?.data || data?.dropdown || data?.roleDropdown || data?.items || data;
  const values = Array.isArray(list) ? list : [];
  const mapped = values
    .map((item) => {
      if (typeof item === 'string') {
        return { label: item.charAt(0).toUpperCase() + item.slice(1), value: item.toLowerCase() };
      }
      if (!item) return null;
      const value = item.value || item.role || item.code || item.id;
      const label = item.label || item.name || item.title || value;
      if (!value) return null;
      return { label: String(label), value: String(value).toLowerCase() };
    })
    .filter(Boolean);

  const unique = [];
  const seen = new Set();
  [...mapped, ...fallbackRoleOptions].forEach((option) => {
    if (!option?.value || seen.has(option.value)) return;
    seen.add(option.value);
    unique.push(option);
  });
  return unique;
};

const getPaginationItems = (currentPage, totalPages) => {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const items = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) items.push('ellipsis-start');
  for (let pageNum = start; pageNum <= end; pageNum += 1) {
    items.push(pageNum);
  }
  if (end < totalPages - 1) items.push('ellipsis-end');
  items.push(totalPages);

  return items;
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [editing, setEditing] = useState(null);
  const [roleOptions, setRoleOptions] = useState(fallbackRoleOptions);
  const [roleOptionsLoading, setRoleOptionsLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', role: 'employee',
    businessName: '', address: '',city: '', state: '',
    designation: '', vehicleType: 'Personal Car (Sedan)', ratePerKm: 0.45,
    newPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

 const fetchUsers = useCallback(async () => {
  try {
    setLoading(true);

    const res = await getUsers({
      page,
      limit: 10,
      search,
      role: roleFilter || undefined,
    });

    setUsers(res.data.users);
    setTotal(res.data.total);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
}, [page, search, roleFilter]);

 useEffect(() => {
  fetchUsers();
}, [fetchUsers]);

  const loadRoleOptions = async () => {
    setRoleOptionsLoading(true);
    try {
      const res = await getUserRoleDropdown();
      const options = normalizeRoleOptions(res.data);
      setRoleOptions(options.length ? options : fallbackRoleOptions);
      return options.length ? options : fallbackRoleOptions;
    } catch (err) {
      console.error(err);
      setRoleOptions(fallbackRoleOptions);
      return fallbackRoleOptions;
    } finally {
      setRoleOptionsLoading(false);
    }
  };

  useEffect(() => {
    loadRoleOptions();
  }, []);

  const openCreate = async (role) => {
    setEditing(null);
    setError('');
    const options = await loadRoleOptions();
    const defaultRole = role || options[0]?.value || 'employee';
    setForm({
      name: '', email: '', password: '', phone: '', role: defaultRole,
      businessName: '', city: '', state: '',
      designation: '', vehicleType: 'Personal Car (Sedan)', ratePerKm: 0.45,
      newPassword: '',
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
      newPassword: '',
    });
    setShowPanel(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (form.phone && form.phone.replace(/\D/g, '').length < 10) {
        setError('Phone number must be at least 10 digits');
        setSaving(false);
        return;
      }
      if (editing) {
        const updateData = { name: form.name, phone: form.phone };
        if (form.newPassword) updateData.newPassword = form.newPassword;
        await updateUser(editing.id, updateData);
      } else {
        if (!form.name || !form.email) {
          setError('Name and Email are required');
          setSaving(false);
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
          setError('Please enter a valid email address');
          setSaving(false);
          return;
        }
        if (form.role === 'employee' && !form.password) {
          setError('Password is required for employees');
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

  const handleActivate = async (id) => {
    if (!window.confirm('Activate this user?')) return;
    await activateUser(id);
    fetchUsers();
  };


  if (loading) return <div className="loading">Loading users...</div>;

  const totalPages = Math.max(1, Math.ceil(total / 10));
  const startItem = total === 0 ? 0 : ((page - 1) * 10) + 1;
  const endItem = Math.min(page * 10, total);
  const paginationItems = getPaginationItems(page, totalPages);

  return (
    <div>
      <h2 className="page-title">User Management</h2>
      <div className="toolbar">
        <input type="text" placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="search-input" />
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="filter-select">
          <option value="">All Roles</option>
          {roleOptionsLoading ? (
            <option value="">Loading roles...</option>
          ) : (
            roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>
        <button className="btn btn-primary" onClick={() => openCreate('employee')}><FiUserPlus /> Add</button>
        
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card" onClick={() => { setRoleFilter(''); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{total}</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => { setRoleFilter('employee'); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Employees</span>
            <span className="stat-value" style={{ color: '#4f46e5' }}>{users.filter(u => u.role === 'employee').length}</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => { setRoleFilter('dealer'); setPage(1); }} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Dealers</span>
            <span className="stat-value" style={{ color: '#059669' }}>{users.filter(u => u.role === 'dealer').length}</span>
          </div>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Email (Username)</th><th>Password</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.name}</td>
                <td>{u.email}</td>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                  {u.plainPassword || '-'}
                </td>
                <td>{u.phone || '-'}</td>
                <td>
                  <span className={`badge ${u.role === 'dealer' ? 'badge-active' : 'badge-shipped'}`}>
                    {u.role}
                  </span>
                </td>
                <td><span className={`badge badge-${u.status}`}>{u.status}</span></td>
                <td>
                  <button className="icon-btn" onClick={() => openEdit(u)} title="Edit"><FiEdit2 /></button>
                  {u.role !== 'admin' && u.status === 'active' && (
                    <button className="icon-btn danger" onClick={() => handleDeactivate(u.id)} title="Deactivate"><FiTrash2 /></button>
                  )}
                  {u.role !== 'admin' && u.status === 'inactive' && (
                    <button className="icon-btn" onClick={() => handleActivate(u.id)} title="Activate" style={{ color: '#059669' }}><FiCheckCircle /></button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="pagination">
          <span>Showing {startItem}-{endItem} of {total} users</span>
          <div className="page-btns">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            {paginationItems.map((item) => {
              if (typeof item === 'string') {
                return (
                  <span key={item} className="page-ellipsis">
                    ...
                  </span>
                );
              }

              return (
                <button
                  key={item}
                  className={`page-btn ${page === item ? 'active' : ''}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              );
            })}
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Side Panel - Create/Edit User */}
      {showPanel && (
        <div className="side-panel">
          <div className="panel-header">
            <h3>{editing ? 'Edit User' : `Add ${form.role === 'employee' ? 'Employee' : 'Dealer'}`}</h3>
            <button className="icon-btn" onClick={() => setShowPanel(false)}><FiX /></button>
          </div>
          <div className="panel-body">
            {error && <div className="alert alert-danger">{error}</div>}

            {!editing && (
              <div className="form-group">
                <label>Role *</label>
                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({ ...form, role: e.target.value })
                  }
                  disabled={roleOptionsLoading}
                >
                  {roleOptionsLoading ? (
                    <option value="">Loading roles...</option>
                  ) : (
                    roleOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Full Name *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter full name" />
            </div>

            {!editing && (
              <div className="form-group">
                <label>Email (Username) *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Enter email" />
              </div>
            )}

            {!editing && form.role === 'employee' && (
              <div className="form-group">
                <label>Password *</label>
                <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Enter password" />
              </div>
            )}

            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setForm({ ...form, phone: v }); }} placeholder="Phone number" maxLength={10} type="tel" />
            </div>

            {/* Update Password (Edit mode - employees only) */}
            {editing && editing.role === 'employee' && (
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiLock size={14} /> Update Password
                </label>
                <input type="text" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} placeholder="Leave empty to keep current password" />
                <small style={{ color: '#6b7280', fontSize: 11, marginTop: 4, display: 'block' }}>Enter new password only if you want to change it</small>
              </div>
            )}

            {/* Employee-specific fields */}
            {form.role === 'employee' && !editing && (
              <>
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0', paddingTop: 16 }}>
                  <span style={{ color: '#4f46e5', fontSize: 13, fontWeight: 600 }}>EMPLOYEE DETAILS</span>
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
                <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0', paddingTop: 16 }}>
                  <span style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>DEALER DETAILS</span>
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

            {(form.role === "retailer" || form.role === "farmer") && (
        <>
          <div style={{ borderTop: '1px solid #e5e7eb', margin: '16px 0', paddingTop: 16 }}>
                        <span style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>DEALER DETAILS</span>
                      </div>

          <div className="form-group">
            <label>Business Name</label>
            <input
              value={form.businessName}
              onChange={(e) =>
                setForm({
                  ...form,
                  businessName: e.target.value,
                })
              }
            />
          </div>

    

    <div className="form-group">
      <label>Address</label>
      <textarea
        value={form.address || ""}
        onChange={(e) =>
          setForm({
            ...form,
            address: e.target.value,
          })
        }
      />
    </div>
  </>
)}

            <div className="panel-footer">
              <button className="btn btn-secondary" onClick={() => setShowPanel(false)}>Cancel</button>
              <button
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving...'
                    : editing
                    ? 'Update User'
                    : form.role === 'employee'
                    ? 'Create Employee'
                    : form.role === 'dealer'
                    ? 'Create Dealer'
                    : form.role === 'retailer'
                    ? 'Create Retailer'
                    : form.role === 'farmer'
                    ? 'Create Farmer'
                    : 'Create User'}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
