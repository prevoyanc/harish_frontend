import { useState, useEffect } from 'react';
import { getAssignments } from '../services/api';
import { FiCheck, FiX, FiMapPin, FiClock } from 'react-icons/fi';

const SalesTracking = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchData = async () => {
    try {
      const res = await getAssignments({ status: statusFilter || undefined });
      setAssignments(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  if (loading) return <div className="loading">Loading...</div>;

  // Flatten all assignment products for stats
  const allProducts = assignments.flatMap(a => (a.products || []).map(p => ({ ...p, assignment: a })));
  const sold = allProducts.filter(p => p.saleStatus === 'submitted').length;
  const notSold = allProducts.filter(p => p.saleStatus === 'rejected').length;
  const pending = allProducts.filter(p => p.saleStatus === 'pending').length;

  return (
    <div>
      <h2 className="page-title">Sales Tracking</h2>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card" onClick={() => setStatusFilter('')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Total Assignments</span>
            <span className="stat-value">{assignments.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Sold</span>
            <span className="stat-value" style={{ color: '#059669' }}>{sold}</span>
          </div>
          <FiCheck size={24} style={{ color: '#059669' }} />
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Not Sold</span>
            <span className="stat-value" style={{ color: '#dc2626' }}>{notSold}</span>
          </div>
          <FiX size={24} style={{ color: '#dc2626' }} />
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <span className="stat-value" style={{ color: '#d97706' }}>{pending}</span>
          </div>
          <FiClock size={24} style={{ color: '#d97706' }} />
        </div>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
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
              <th>Sale Status</th>
              <th>Address</th>
              <th>Location</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              (a.products || []).map((ap, i) => (
                <tr key={`${a.id}-${ap.id}`}>
                  {i === 0 ? (
                    <>
                      <td rowSpan={a.products.length} style={{ verticalAlign: 'top', borderRight: '1px solid #e5e7eb' }}>{a.assignedDate}</td>
                      <td rowSpan={a.products.length} style={{ verticalAlign: 'top', borderRight: '1px solid #e5e7eb' }}>
                        <div style={{ fontWeight: 500 }}>{a.employee?.user?.name}</div>
                        <small style={{ color: '#9ca3af' }}>{a.employee?.user?.email}</small>
                      </td>
                      <td rowSpan={a.products.length} style={{ verticalAlign: 'top', borderRight: '1px solid #e5e7eb' }}>
                        {a.dealer?.businessName || a.dealer?.user?.name}
                      </td>
                    </>
                  ) : null}
                  <td>
                    <div>{ap.product?.name}</div>
                    <small style={{ color: '#9ca3af' }}>{ap.product?.sku}</small>
                  </td>
                  <td>
                    <span className={`badge ${ap.saleStatus === 'submitted' ? 'badge-active' : ap.saleStatus === 'rejected' ? 'badge-inactive' : 'badge-pending'}`}>
                      {ap.saleStatus === 'submitted' ? 'Sold' : ap.saleStatus === 'rejected' ? 'Not Sold' : 'Pending'}
                    </span>
                  </td>
                  <td>
                    {ap.address ? (
                      <div style={{ fontSize: 12, color: '#374151', maxWidth: 200 }}>{ap.address}</div>
                    ) : (
                      <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                    )}
                  </td>
                  <td>
                    {ap.latitude && ap.longitude ? (
                      <a
                        href={`https://maps.google.com/?q=${ap.latitude},${ap.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#4f46e5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <FiMapPin size={12} /> View Map
                      </a>
                    ) : <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>}
                  </td>
                  <td style={{ fontSize: 12, color: '#6b7280' }}>
                    {ap.submittedAt ? new Date(ap.submittedAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))
            ))}
            {assignments.length === 0 && (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>No assignments yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SalesTracking;
