import { useState, useEffect, useRef } from 'react';
import { getAssignments, getKmReport } from '../services/api';
import { FiCheck, FiX, FiMapPin, FiClock, FiCalendar, FiChevronLeft, FiChevronRight, FiSearch, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const ITEMS_PER_PAGE = 3;

// Haversine formula to calculate distance between two lat/lng points in KM
const calcKm = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const SalesTracking = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [employeeDropdownSearch, setEmployeeDropdownSearch] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowEmployeeDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        status: statusFilter || undefined,
        fromDate: fromDate || undefined,
        toDate: toDate || undefined,
      };
      const res = await getAssignments(params);
      setAssignments(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [statusFilter, fromDate, toDate]);

  // Client-side filtering (date + employee name)
  const filteredAssignments = assignments.filter(a => {
    // Date filter
    if (fromDate || toDate) {
      const aDate = a.assignedDate ? a.assignedDate.split('T')[0] : '';
      if (fromDate && aDate < fromDate) return false;
      if (toDate && aDate > toDate) return false;
    }
    // Employee name filter
    if (employeeSearch) {
      const name = (a.employee?.user?.name || '').toLowerCase();
      const email = (a.employee?.user?.email || '').toLowerCase();
      const search = employeeSearch.toLowerCase();
      if (!name.includes(search) && !email.includes(search)) return false;
    }
    return true;
  });

  // Pagination on filtered assignments
  const totalItems = filteredAssignments.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
  const paginatedAssignments = filteredAssignments
    .sort((a, b) => new Date(b.assignedDate || 0) - new Date(a.assignedDate || 0))
    .slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page to 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, fromDate, toDate, employeeSearch]);

  // Group paginated assignments by date
  const groupedByDate = {};
  paginatedAssignments.forEach(a => {
    const date = a.assignedDate || 'Unknown';
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(a);
  });
  const sortedDates = Object.keys(groupedByDate).sort((a, b) => new Date(b) - new Date(a));

  // Assignment-level stats
  const completedCount = filteredAssignments.filter(a => a.status === 'completed').length;
  const pendingCount = filteredAssignments.filter(a => a.status !== 'completed').length;

  // Per-employee daily KM: group by employee+date, calculate distance between consecutive visits
  const employeeDailyKm = (() => {
    const byEmpDate = {};
    filteredAssignments.forEach(a => {
      const empId = a.employee?.id || 'unknown';
      const empName = a.employee?.user?.name || 'Unknown';
      const empEmail = a.employee?.user?.email || '';
      const date = a.assignedDate || '';
      const dealerName = a.dealer?.businessName || a.dealer?.user?.name || 'Unknown Dealer';
      const key = `${empId}-${date}`;
      if (!byEmpDate[key]) byEmpDate[key] = { empId, empName, empEmail, date, locations: [], visits: 0, dealers: [], completed: 0, pending: 0 };
      byEmpDate[key].visits++;
      if (a.status === 'completed') byEmpDate[key].completed++;
      else byEmpDate[key].pending++;
      byEmpDate[key].dealers.push({ name: dealerName, lat: a.latitude ? parseFloat(a.latitude) : null, lng: a.longitude ? parseFloat(a.longitude) : null });
      if (a.latitude && a.longitude) {
        byEmpDate[key].locations.push({ lat: parseFloat(a.latitude), lng: parseFloat(a.longitude) });
      }
    });
    return Object.values(byEmpDate).map(entry => {
      let km = 0;
      // Calculate KM per dealer (distance from previous visit)
      const dealersWithKm = entry.dealers.map((dealer, i) => {
        let dealerKm = 0;
        if (i > 0 && dealer.lat && dealer.lng && entry.dealers[i - 1].lat && entry.dealers[i - 1].lng) {
          dealerKm = calcKm(entry.dealers[i - 1].lat, entry.dealers[i - 1].lng, dealer.lat, dealer.lng) || 0;
        }
        km += dealerKm;
        return { ...dealer, km: dealerKm };
      });
      return { ...entry, km, dealersWithKm };
    }).sort((a, b) => new Date(b.date) - new Date(a.date) || a.empName.localeCompare(b.empName));
  })();

  const formatDate = (dateStr) => {
    if (!dateStr || dateStr === 'Unknown') return dateStr;
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isToday = d.toDateString() === today.toDateString();
    const isYesterday = d.toDateString() === yesterday.toDateString();
    const formatted = d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
    if (isToday) return `Today — ${formatted}`;
    if (isYesterday) return `Yesterday — ${formatted}`;
    return formatted;
  };

  const handleQuickFilter = (type) => {
    const today = new Date();
    const fmt = (d) => d.toISOString().split('T')[0];
    if (type === 'today') {
      setFromDate(fmt(today));
      setToDate(fmt(today));
    } else if (type === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(today.getDate() - 7);
      setFromDate(fmt(weekAgo));
      setToDate(fmt(today));
    } else if (type === 'month') {
      const monthAgo = new Date();
      monthAgo.setDate(today.getDate() - 30);
      setFromDate(fmt(monthAgo));
      setToDate(fmt(today));
    } else {
      setFromDate('');
      setToDate('');
    }
  };

  // Download Excel for all employees (Punch In → Visits → Punch Out with KM)
  const downloadAllKmReport = async () => {
    try {
      // Fetch KM report for all dates in range
      const dates = [...new Set(filteredAssignments.map(a => a.assignedDate).filter(Boolean))];
      const allData = [];
      for (const d of dates) {
        const res = await getKmReport({ date: d });
        allData.push(...res.data);
      }

      const rows = [];
      allData.forEach(entry => {
        entry.legs.forEach((leg, i) => {
          if (leg.type === 'punch_in') {
            rows.push({
              'Employee': entry.employeeName,
              'Email': entry.employeeEmail,
              'Date': entry.date,
              'From': '-',
              'To': `Punch In (${leg.to})`,
              'KM': 0,
              'Type': 'Punch In',
            });
          } else if (leg.type === 'visit') {
            rows.push({
              'Employee': '',
              'Email': '',
              'Date': '',
              'From': leg.from,
              'To': leg.to,
              'KM': leg.km,
              'Type': 'Dealer Visit',
            });
          } else if (leg.type === 'punch_out') {
            rows.push({
              'Employee': '',
              'Email': '',
              'Date': '',
              'From': leg.from,
              'To': `Punch Out (${leg.to})`,
              'KM': leg.km,
              'Type': 'Punch Out',
            });
          }
        });
        rows.push({
          'Employee': '',
          'Email': '',
          'Date': '',
          'From': '',
          'To': `TOTAL (${entry.totalVisits} visits)`,
          'KM': entry.totalKm,
          'Type': '',
        });
        rows.push({ 'Employee': '', 'Email': '', 'Date': '', 'From': '', 'To': '', 'KM': '', 'Type': '' });
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'All Employees KM');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `All_Employees_KM_Report.xlsx`);
    } catch (err) { console.error('Download failed:', err); }
  };

  // Download Excel for a single employee
  const downloadSingleKmReport = async (empName, empEmail) => {
    try {
      const dates = [...new Set(filteredAssignments.filter(a => (a.employee?.user?.email) === empEmail).map(a => a.assignedDate).filter(Boolean))];
      const allData = [];
      for (const d of dates) {
        const res = await getKmReport({ date: d });
        allData.push(...res.data.filter(r => r.employeeEmail === empEmail));
      }

      const rows = [];
      allData.forEach(entry => {
        entry.legs.forEach((leg, i) => {
          if (leg.type === 'punch_in') {
            rows.push({
              'Date': entry.date,
              'From': '-',
              'To': `Punch In (${leg.to})`,
              'KM': 0,
              'Type': 'Punch In',
            });
          } else if (leg.type === 'visit') {
            rows.push({
              'Date': '',
              'From': leg.from,
              'To': leg.to,
              'KM': leg.km,
              'Type': 'Dealer Visit',
            });
          } else if (leg.type === 'punch_out') {
            rows.push({
              'Date': '',
              'From': leg.from,
              'To': `Punch Out (${leg.to})`,
              'KM': leg.km,
              'Type': 'Punch Out',
            });
          }
        });
        rows.push({
          'Date': '',
          'From': '',
          'To': `TOTAL (${entry.totalVisits} visits)`,
          'KM': entry.totalKm,
          'Type': '',
        });
      });

      const ws = XLSX.utils.json_to_sheet(rows);
      ws['!cols'] = [{ wch: 14 }, { wch: 25 }, { wch: 25 }, { wch: 10 }, { wch: 14 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'KM Report');
      const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      saveAs(new Blob([buf], { type: 'application/octet-stream' }), `${empName.replace(/\s+/g, '_')}_KM_Report.xlsx`);
    } catch (err) { console.error('Download failed:', err); }
  };

  return (
    <div>
      <h2 className="page-title">Sales Tracking</h2>

      <div className="stats-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card" onClick={() => setStatusFilter('')} style={{ cursor: 'pointer' }}>
          <div className="stat-info">
            <span className="stat-label">Total Assignments</span>
            <span className="stat-value">{filteredAssignments.length}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value" style={{ color: '#059669' }}>{completedCount}</span>
          </div>
          <FiCheck size={24} style={{ color: '#059669' }} />
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <span className="stat-label">Pending</span>
            <span className="stat-value" style={{ color: '#d97706' }}>{pendingCount}</span>
          </div>
          <FiClock size={24} style={{ color: '#d97706' }} />
        </div>
      </div>

      {/* Employee Daily KM Report */}
      {employeeDailyKm.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <FiMapPin size={18} style={{ color: '#2563eb' }} /> Employee Daily KM Report
            </h3>
            <button onClick={downloadAllKmReport}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 6, border: '1px solid #2563eb', background: '#2563eb', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
              <FiDownload size={14} /> Download All
            </button>
          </div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Date</th>
                  <th>Visits</th>
                  <th>KM Traveled</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {employeeDailyKm.map((row, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{row.empName}</div>
                      <small style={{ color: '#9ca3af' }}>{row.empEmail}</small>
                    </td>
                    <td>{formatDate(row.date)}</td>
                    <td>{row.visits}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: row.km > 0 ? '#2563eb' : '#9ca3af' }}>
                        {row.km > 0 ? `${row.km.toFixed(1)} km` : row.locations.length > 0 ? '0 km' : 'No GPS'}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => downloadSingleKmReport(row.empName, row.empEmail)}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4, border: '1px solid #d1d5db', background: '#fff', color: '#2563eb', cursor: 'pointer', fontSize: 12 }}>
                        <FiDownload size={12} /> Excel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="toolbar" style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div ref={dropdownRef} style={{ position: 'relative', minWidth: 200 }}>
          <div
            onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
            style={{
              padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, background: '#fff',
              color: employeeSearch ? '#1a1a2e' : '#9ca3af'
            }}
          >
            <FiSearch size={14} style={{ color: '#9ca3af' }} />
            {employeeSearch || 'All Employees'}
            {employeeSearch && (
              <span onClick={(e) => { e.stopPropagation(); setEmployeeSearch(''); setEmployeeDropdownSearch(''); }}
                style={{ marginLeft: 'auto', cursor: 'pointer', color: '#9ca3af', fontSize: 16, lineHeight: 1 }}>&times;</span>
            )}
          </div>
          {showEmployeeDropdown && (
            <div style={{
              position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
              background: '#fff', border: '1px solid #d1d5db', borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)', marginTop: 4, maxHeight: 250, overflow: 'hidden'
            }}>
              <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                <input
                  autoFocus
                  type="text"
                  placeholder="Type to search..."
                  value={employeeDropdownSearch}
                  onChange={(e) => setEmployeeDropdownSearch(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{ width: '100%', padding: '6px 8px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: 13, outline: 'none' }}
                />
              </div>
              <div style={{ maxHeight: 190, overflowY: 'auto' }}>
                <div
                  onClick={() => { setEmployeeSearch(''); setEmployeeDropdownSearch(''); setShowEmployeeDropdown(false); }}
                  style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, color: '#6b7280', borderBottom: '1px solid #f3f4f6' }}
                  onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.background = 'transparent'}
                >
                  All Employees
                </div>
                {[...new Map(assignments.map(a => [a.employee?.user?.email, { name: a.employee?.user?.name, email: a.employee?.user?.email }])).values()]
                  .filter(emp => emp.name && (
                    !employeeDropdownSearch ||
                    emp.name.toLowerCase().includes(employeeDropdownSearch.toLowerCase()) ||
                    (emp.email || '').toLowerCase().includes(employeeDropdownSearch.toLowerCase())
                  ))
                  .map(emp => (
                    <div key={emp.email}
                      onClick={() => { setEmployeeSearch(emp.name); setEmployeeDropdownSearch(''); setShowEmployeeDropdown(false); }}
                      style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f3f4f6' }}
                      onMouseEnter={(e) => e.target.style.background = '#f3f4f6'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      <div style={{ fontWeight: 500, color: '#1a1a2e' }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{emp.email}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCalendar size={16} style={{ color: '#6b7280' }} />
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
          <span style={{ color: '#9ca3af' }}>to</span>
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {['today', 'week', 'month', 'all'].map(type => (
            <button key={type} onClick={() => handleQuickFilter(type)}
              style={{
                padding: '5px 12px', borderRadius: 6, border: '1px solid #d1d5db', background:
                  (type === 'all' && !fromDate && !toDate) ? '#4f46e5' :
                  (type === 'today' && fromDate === toDate && fromDate === new Date().toISOString().split('T')[0]) ? '#4f46e5' : '#fff',
                color:
                  (type === 'all' && !fromDate && !toDate) ? '#fff' :
                  (type === 'today' && fromDate === toDate && fromDate === new Date().toISOString().split('T')[0]) ? '#fff' : '#374151',
                cursor: 'pointer', fontSize: 12, fontWeight: 500, textTransform: 'capitalize'
              }}
            >
              {type === 'all' ? 'All Dates' : type === 'week' ? 'Last 7 Days' : type === 'month' ? 'Last 30 Days' : 'Today'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : sortedDates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No assignments found for the selected filters</div>
      ) : (
        <>
          {sortedDates.map(date => (
            <div key={date} style={{ marginTop: 20 }}>
              <div style={{
                padding: '8px 16px', background: '#f3f4f6', borderRadius: '8px 8px 0 0',
                fontWeight: 600, fontSize: 14, color: '#374151', display: 'flex', alignItems: 'center', gap: 8,
                borderBottom: '2px solid #4f46e5'
              }}>
                <FiCalendar size={14} style={{ color: '#4f46e5' }} />
                {formatDate(date)}
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#6b7280', fontWeight: 400, display: 'flex', gap: 12 }}>
                  <span>{groupedByDate[date].length} assignment{groupedByDate[date].length !== 1 ? 's' : ''}</span>
                  <span style={{ color: '#2563eb', fontWeight: 500 }}>
                    {(() => {
                      let km = 0;
                      let prev = null;
                      groupedByDate[date].forEach(a => {
                        if (a.latitude && a.longitude) {
                          if (prev) {
                            const d = calcKm(prev.lat, prev.lng, a.latitude, a.longitude);
                            if (d) km += d;
                          }
                          prev = { lat: a.latitude, lng: a.longitude };
                        }
                      });
                      return km > 0 ? `${km.toFixed(1)} km` : '';
                    })()}
                  </span>
                </span>
              </div>
              <div className="table-container" style={{ borderRadius: '0 0 8px 8px', marginBottom: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Dealer</th>
                      <th>Status</th>
                      <th>Shop Image</th>
                      <th>KM</th>
                      <th>Address</th>
                      <th>Location</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const rows = [];
                      let prevLoc = null;
                      groupedByDate[date].forEach((a) => {
                        let km = 0;
                        if (a.latitude && a.longitude && prevLoc) {
                          km = calcKm(prevLoc.lat, prevLoc.lng, a.latitude, a.longitude) || 0;
                        }
                        if (a.latitude && a.longitude) prevLoc = { lat: a.latitude, lng: a.longitude };

                        const imgUrl = a.imageUrl ? (a.imageUrl.startsWith('http') ? a.imageUrl : `http://35.207.195.114:9000/backend/api${a.imageUrl}`) : null;

                        rows.push(
                          <tr key={a.id}>
                            <td>
                              <div style={{ fontWeight: 500 }}>{a.employee?.user?.name}</div>
                              <small style={{ color: '#9ca3af' }}>{a.employee?.user?.email}</small>
                            </td>
                            <td>{a.dealer?.businessName || a.dealer?.user?.name}</td>
                            <td>
                              <span className={`badge badge-${a.status === 'completed' ? 'active' : a.status === 'in_progress' ? 'pending' : 'draft'}`}>
                                {a.status}
                              </span>
                            </td>
                            <td>
                              {imgUrl ? (
                                <a href={imgUrl} target="_blank" rel="noreferrer">
                                  <img src={imgUrl} alt="shop" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
                                </a>
                              ) : <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>}
                            </td>
                            <td>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#2563eb' }}>
                                {km > 0 ? `${km.toFixed(1)} km` : (a.latitude ? '0 km' : '-')}
                              </div>
                            </td>
                            <td>
                              {a.address ? (
                                <div style={{ fontSize: 12, color: '#374151', maxWidth: 200 }}>{a.address}</div>
                              ) : <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>}
                            </td>
                            <td>
                              {a.latitude && a.longitude ? (
                                <a href={`https://maps.google.com/?q=${a.latitude},${a.longitude}`} target="_blank" rel="noreferrer"
                                  style={{ color: '#4f46e5', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <FiMapPin size={12} /> View Map
                                </a>
                              ) : <span style={{ color: '#9ca3af', fontSize: 12 }}>-</span>}
                            </td>
                            <td style={{ fontSize: 12, color: '#6b7280' }}>
                              {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : '-'}
                            </td>
                          </tr>
                        );
                      });
                      return rows;
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 24, padding: '12px 16px', background: '#fff', borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems} assignments
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: currentPage === 1 ? '#f3f4f6' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  color: currentPage === 1 ? '#d1d5db' : '#374151', display: 'flex', alignItems: 'center'
                }}
              >
                <FiChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '6px 12px', borderRadius: 6, border: '1px solid #d1d5db',
                    background: page === currentPage ? '#4f46e5' : '#fff',
                    color: page === currentPage ? '#fff' : '#374151',
                    cursor: 'pointer', fontSize: 13, fontWeight: page === currentPage ? 600 : 400,
                    minWidth: 36
                  }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '6px 10px', borderRadius: 6, border: '1px solid #d1d5db',
                  background: currentPage === totalPages ? '#f3f4f6' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  color: currentPage === totalPages ? '#d1d5db' : '#374151', display: 'flex', alignItems: 'center'
                }}
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SalesTracking;
