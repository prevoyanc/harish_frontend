import { useState, useEffect } from 'react';
import { getSaleSubmissions } from '../services/api';
import { FiCheck, FiX, FiMapPin } from 'react-icons/fi';

const SalesTracking = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    try {
      const res = await getSaleSubmissions({ status: statusFilter || undefined });
      setSubmissions(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  if (loading) return <div className="loading">Loading...</div>;

  const submitted = submissions.filter(s => s.status === 'submitted').length;
  const rejected = submissions.filter(s => s.status === 'rejected').length;

  return (
    <div>
      <h2 className="page-title">Sales Tracking</h2>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card" onClick={() => setStatusFilter('')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Total Submissions</span>
            <span className="stat-value">{submissions.length}</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('submitted')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Sold (Submitted)</span>
            <span className="stat-value" style={{ color: '#3fb950' }}>{submitted}</span>
          </div>
          <FiCheck size={24} style={{ color: '#3fb950' }} />
        </div>
        <div className="stat-card" onClick={() => setStatusFilter('rejected')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Not Sold (Rejected)</span>
            <span className="stat-value" style={{ color: '#f85149' }}>{rejected}</span>
          </div>
          <FiX size={24} style={{ color: '#f85149' }} />
        </div>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="submitted">Sold (Submitted)</option>
          <option value="rejected">Not Sold (Rejected)</option>
        </select>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Employee</th>
              <th>Dealer</th>
              <th>Product</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Location</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id}>
                <td>{new Date(s.createdAt).toLocaleString()}</td>
                <td>
                  <div>{s.employee?.user?.name}</div>
                  <small style={{ color: '#8b949e' }}>{s.employee?.user?.email}</small>
                </td>
                <td>
                  <div>{s.dealer?.businessName || s.dealer?.user?.name}</div>
                </td>
                <td>
                  <div>{s.product?.name}</div>
                  <small style={{ color: '#8b949e' }}>{s.product?.sku} | {s.product?.category?.name}</small>
                </td>
                <td>{s.quantity}</td>
                <td>
                  <span className={`badge ${s.status === 'submitted' ? 'badge-active' : 'badge-inactive'}`}>
                    {s.status === 'submitted' ? 'Sold' : 'Not Sold'}
                  </span>
                </td>
                <td>
                  {s.latitude && s.longitude ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FiMapPin size={12} style={{ color: '#58a6ff' }} />
                      <a
                        href={`https://maps.google.com/?q=${s.latitude},${s.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#58a6ff', fontSize: 12 }}
                      >
                        View Map
                      </a>
                    </div>
                  ) : '-'}
                  {s.address && <div style={{ color: '#8b949e', fontSize: 11 }}>{s.address}</div>}
                </td>
                <td style={{ color: '#8b949e', fontSize: 12 }}>{s.notes || '-'}</td>
              </tr>
            ))}
            {submissions.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>No submissions yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTracking;
