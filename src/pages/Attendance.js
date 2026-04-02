import { useState, useEffect } from 'react';
import { getDailyReport, adminPunch, markAbsent, getAllAllocations } from '../services/api';
import { FiCheck, FiX, FiMapPin, FiClock, FiAlertCircle, FiUserPlus } from 'react-icons/fi';

const Attendance = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(null); // { type: 'punch'|'absent', employeeId, name }
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getDailyReport({ date });
      setReport(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [date]);

  const handleAdminPunch = async () => {
    setSaving(true);
    try {
      await adminPunch({ employeeId: showModal.employeeId, reason, status: 'admin_punch' });
      setShowModal(null);
      setReason('');
      fetchData();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const handleMarkAbsent = async () => {
    setSaving(true);
    try {
      await markAbsent({ employeeId: showModal.employeeId, reason });
      setShowModal(null);
      setReason('');
      fetchData();
    } catch (err) { console.error(err); }
    setSaving(false);
  };

  const formatTime = (dt) => {
    if (!dt) return '-';
    const d = new Date(dt);
    const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
    const h = ist.getUTCHours() % 12 || 12;
    const m = ist.getUTCMinutes().toString().padStart(2, '0');
    const ampm = ist.getUTCHours() >= 12 ? 'PM' : 'AM';
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  };

  const getStatusBadge = (status) => {
    const map = {
      present: { label: 'Present', cls: 'badge-active' },
      absent: { label: 'Absent', cls: 'badge-inactive' },
      not_punched_out: { label: 'Not Punched Out', cls: 'badge-pending' },
      admin_punch: { label: 'Admin Marked', cls: 'badge-shipped' },
    };
    const s = map[status] || { label: status, cls: 'badge-pending' };
    return <span className={`badge ${s.cls}`}>{s.label}</span>;
  };

  if (loading) return <div className="loading">Loading attendance...</div>;

  return (
    <div>
      <h2 className="page-title">Daily Attendance</h2>

      {/* Date Picker + Stats */}
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="search-input" style={{ minWidth: 160 }} />
      </div>

      {report && (
        <div className="stats-grid" style={{ marginBottom: 16 }}>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total Employees</span>
              <span className="stat-value">{report.total}</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Present</span>
              <span className="stat-value" style={{ color: '#059669' }}>{report.present}</span>
            </div>
            <FiCheck size={24} style={{ color: '#059669' }} />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Absent</span>
              <span className="stat-value" style={{ color: '#dc2626' }}>{report.absent}</span>
            </div>
            <FiX size={24} style={{ color: '#dc2626' }} />
          </div>
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Not Punched Out</span>
              <span className="stat-value" style={{ color: '#d97706' }}>{report.notPunchedOut}</span>
            </div>
            <FiAlertCircle size={24} style={{ color: '#d97706' }} />
          </div>
        </div>
      )}

      {/* Attendance Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Status</th>
              <th>Punch In</th>
              <th>Punch In Location</th>
              <th>Punch Out</th>
              <th>Punch Out Location</th>
              <th>Hours</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(report?.report || []).map((r, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 500 }}>{r.name}</div>
                  <small style={{ color: '#9ca3af' }}>{r.email}</small>
                </td>
                <td>{getStatusBadge(r.status)}</td>
                <td style={{ fontSize: 13 }}>
                  {r.punchIn ? formatTime(r.punchIn) : '-'}
                </td>
                <td>
                  {r.punchInAddress && <div style={{ fontSize: 12, color: '#374151' }}>{r.punchInAddress}</div>}
                  {r.punchInLat && r.punchInLng ? (
                    <a href={`https://maps.google.com/?q=${r.punchInLat},${r.punchInLng}`} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiMapPin size={10} /> Map
                    </a>
                  ) : '-'}
                </td>
                <td style={{ fontSize: 13 }}>
                  {r.punchOut ? formatTime(r.punchOut) : (r.punchIn ? <span style={{ color: '#d97706' }}>Active</span> : '-')}
                </td>
                <td>
                  {r.punchOutAddress && <div style={{ fontSize: 12, color: '#374151' }}>{r.punchOutAddress}</div>}
                  {r.punchOutLat && r.punchOutLng ? (
                    <a href={`https://maps.google.com/?q=${r.punchOutLat},${r.punchOutLng}`} target="_blank" rel="noreferrer" style={{ color: '#4f46e5', fontSize: 11, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <FiMapPin size={10} /> Map
                    </a>
                  ) : '-'}
                </td>
                <td style={{ fontSize: 13 }}>{r.totalHours ? `${r.totalHours}h` : '-'}</td>
                <td style={{ fontSize: 12, color: '#6b7280' }}>{r.reason || '-'}</td>
                <td>
                  {r.markedBy ? (
                    <span style={{ color: '#9ca3af', fontSize: 11, fontStyle: 'italic' }}>Admin marked</span>
                  ) : r.status === 'present' || r.status === 'not_punched_out' ? (
                    <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>
                  ) : (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { setShowModal({ type: 'punch', employeeId: r.employeeId, name: r.name }); setReason(''); }}>
                        <FiCheck size={12} /> Present
                      </button>
                      <button className="btn btn-sm" style={{ background: '#dc2626' }} onClick={() => { setShowModal({ type: 'absent', employeeId: r.employeeId, name: r.name }); setReason(''); }}>
                        <FiX size={12} /> Absent
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {(!report?.report || report.report.length === 0) && (
              <tr><td colSpan="9" style={{ textAlign: 'center' }}>No employees found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Admin Punch / Absent Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 400, maxWidth: '90%' }}>
            <h3 style={{ marginBottom: 16, color: '#1a1a2e' }}>
              {showModal.type === 'punch' ? 'Admin Punch-In' : 'Mark Absent'} - {showModal.name}
            </h3>
            <div className="form-group">
              <label>Reason *</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={showModal.type === 'punch' ? 'Why are you marking attendance for this employee?' : 'Reason for absence'}
                rows="3"
                style={{ width: '100%', background: '#f5f7fa', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', color: '#1a1a2e', fontSize: 14, resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={showModal.type === 'punch' ? handleAdminPunch : handleMarkAbsent}
                disabled={saving || !reason.trim()}
              >
                {saving ? 'Saving...' : showModal.type === 'punch' ? 'Mark Present' : 'Mark Absent'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
