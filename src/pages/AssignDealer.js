import { useState, useEffect, useRef } from 'react';
import { getEmployeeDropdown, getDealerDropdown, getEmpWiseDealers, createEmpWiseDealers, updateEmpWiseDealers, deleteEmpWiseDealers } from '../services/api';
import { FiUserCheck, FiX, FiTrash2, FiSearch, FiChevronDown, FiEdit2 } from 'react-icons/fi';
import Toast from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';

const AssignDealer = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewDealersModal, setViewDealersModal] = useState(null);

  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState(null);

  const showToast = (type, message) => setToast({ type, message });

  // Modal data from API
  const [employees, setEmployees] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDealers, setSelectedDealers] = useState([]);

  // Dropdown states
  const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
  const [dealerDropdownOpen, setDealerDropdownOpen] = useState(false);
  const [empSearch, setEmpSearch] = useState('');
  const [dealerSearch, setDealerSearch] = useState('');
  const empDropRef = useRef(null);
  const dealerDropRef = useRef(null);
  const modalBodyRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (empDropRef.current && !empDropRef.current.contains(e.target)) setEmpDropdownOpen(false);
      if (dealerDropRef.current && !dealerDropRef.current.contains(e.target)) setDealerDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchAssignments = async (p = page) => {
    setLoading(true);
    try {
      const res = await getEmpWiseDealers({ page: p, limit });
      const result = res.data?.data || {};
      const list = Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : [];
      setAssignments(list);
      setTotal(result.totalRecords || list.length);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAssignments(page); }, [page]);

  const loadDropdowns = async () => {
    try {
      const [eRes, dRes] = await Promise.all([getEmployeeDropdown(), getDealerDropdown()]);
      setEmployees(eRes.data.data);
      setDealers(dRes.data.data);
    } catch (err) { console.error(err); }
  };

  const openModal = async () => {
    setEditingId(null);
    setSelectedEmployees([]);
    setSelectedDealers([]);
    setEmpSearch('');
    setDealerSearch('');
    await loadDropdowns();
    setShowModal(true);
  };

  const openEdit = async (row) => {
    setEditingId(row.id);
    setEmpSearch('');
    setDealerSearch('');
    await loadDropdowns();
    // Pre-select employee
    setSelectedEmployees(row.employee ? [row.employee.employee_id] : []);
    // Pre-select dealers
    setSelectedDealers(row.dealers.map(d => d.dealer_id));
    setShowModal(true);
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleDealer = (id) => {
    setSelectedDealers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleAssign = async () => {
    if (selectedEmployees.length === 0 || selectedDealers.length === 0) {
      showToast('error', 'Please select at least one employee and one dealer');
      return;
    }
    setSaving(true);

    try {
      if (editingId) {
        await updateEmpWiseDealers(editingId, {
          emp_id: selectedEmployees[0],
          dealer_id: selectedDealers,
        });
      } else {
        await createEmpWiseDealers({
          emp_id: selectedEmployees,
          dealer_id: selectedDealers,
        });
      }

      setShowModal(false);
      setEditingId(null);
      showToast('success', editingId ? 'Assignment updated successfully.' : 'Dealers assigned successfully.');
      setPage(1);
      await fetchAssignments(1);
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to assign dealers. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      message: 'Are you sure you want to delete this assignment?',
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await deleteEmpWiseDealers(id);
          showToast('success', 'Assignment deleted successfully.');
          await fetchAssignments(page);
        } catch (err) {
          console.error(err);
          showToast('error', 'Failed to delete assignment.');
        }
      },
    });
  };

  const filteredEmployees = employees.filter(e =>
    !empSearch || (e.name || '').toLowerCase().includes(empSearch.toLowerCase())
  );

  const filteredDealers = dealers.filter(d =>
    !dealerSearch || (d.name || '').toLowerCase().includes(dealerSearch.toLowerCase())
  );

  return (
    <div>
      <h2 className="page-title">Assign Dealer</h2>

      <div className="toolbar" style={{ justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={openModal}><FiUserCheck /> Assign</button>
      </div>

      {/* Assignments Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>Created Date</th><th>Employee Name</th><th>Assigned Dealers</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: 20 }}>Loading...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan="4" style={{ textAlign: 'center' }}>No assignments yet. Click "Assign" to assign dealers to employees.</td></tr>
            ) : (
              assignments?.map((row) => {
                const dealerNames = row.dealers.map(d => d.name);
                const firstDealer = dealerNames[0] || '-';
                const totalDealers = dealerNames.length;
                const createdDate = row.createdat ? new Date(row.createdat).toLocaleDateString('en-IN') : '-';
                return (
                  <tr key={row.id}>
                    <td>{createdDate}</td>
                    <td style={{ fontWeight: 500 }}>{row.employee?.name || '-'}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          className="badge badge-shipped"
                          style={{ fontSize: 11, cursor: 'pointer' }}
                          onClick={() => setViewDealersModal(row)}
                        >{firstDealer}</span>
                        {totalDealers > 1 && (
                          <button
                            onClick={() => setViewDealersModal(row)}
                            style={{
                              background: '#eef2ff', color: '#4f46e5', border: '1px solid #c7d2fe',
                              borderRadius: 12, padding: '2px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                            }}
                          >
                            +{totalDealers - 1} more
                          </button>
                        )}
                      </div>
                    </td>
                    <td>
                      <button className="icon-btn" onClick={() => openEdit(row)} title="Edit"><FiEdit2 /></button>
                      <button className="icon-btn danger" onClick={() => handleDelete(row.id)} title="Delete"><FiTrash2 /></button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {total > 0 && (
          <div className="pagination">
            <span>Showing {assignments.length} of {total} assignments</span>
            <div className="page-btns">
              {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
                <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* View Dealers Modal */}
      {viewDealersModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewDealersModal(null)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 500, maxWidth: '90%', maxHeight: '80vh', overflow: 'hidden' }}
            onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, color: '#1a1a2e' }}>Assigned Dealers</h3>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6b7280' }}>
                  {viewDealersModal.employee?.name} — {viewDealersModal.createdat ? new Date(viewDealersModal.createdat).toLocaleDateString('en-IN') : '-'}
                </p>
              </div>
              <button onClick={() => setViewDealersModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}>&times;</button>
            </div>
            <div style={{ padding: 16, overflowY: 'auto', maxHeight: '60vh' }}>
              {viewDealersModal.dealers.map((d, i) => (
                <div key={d.dealer_id} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', marginBottom: 8,
                  background: '#f9fafb', borderRadius: 10, border: '1px solid #e5e7eb',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(79,70,229,0.1)', color: '#4f46e5', fontWeight: 700, fontSize: 14,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500, color: '#1a1a2e', fontSize: 14 }}>{d.name}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #e5e7eb', textAlign: 'right' }}>
              <button className="btn btn-secondary" onClick={() => setViewDealersModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign / Edit Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
            zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 12, width: 540, maxWidth: '92%',
              height: 550, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '16px 20px', borderBottom: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <h3 style={{ margin: 0, fontSize: 17, color: '#1a1a2e' }}>
                {editingId ? 'Edit Assignment' : 'Assign Dealers to Employees'}
              </h3>
              <button onClick={() => setShowModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 20 }}>
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div ref={modalBodyRef} style={{ padding: 20, flex: 1, overflowY: 'auto' }}>

              {/* Employees Multi-Select */}
              <div style={{ marginBottom: 20, position: 'relative' }} ref={empDropRef}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  Select Employees ({selectedEmployees.length} selected)
                </label>
                <div
                  onClick={() => {
                    setEmpDropdownOpen(!empDropdownOpen);
                    if (!empDropdownOpen) {
                      setTimeout(() => empDropRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', minHeight: 40,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                    {selectedEmployees.length === 0 ? (
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>Choose employees...</span>
                    ) : (
                      selectedEmployees.map(id => {
                        const emp = employees.find(e => e.employee_id === id);
                        return emp ? (
                          <span key={id} style={{
                            background: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: 12,
                            fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {emp.name}
                            <span onClick={(e) => { e.stopPropagation(); toggleEmployee(id); }}
                              style={{ cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>&times;</span>
                          </span>
                        ) : null;
                      })
                    )}
                  </div>
                  <FiChevronDown size={16} style={{
                    color: '#9ca3af', flexShrink: 0,
                    transform: empDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s',
                  }} />
                </div>

                {empDropdownOpen && (
                  <div style={{
                    border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, background: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden',
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  }}>
                    <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#f9fafb', borderRadius: 6, padding: '6px 8px', border: '1px solid #e5e7eb',
                      }}>
                        <FiSearch size={14} style={{ color: '#9ca3af' }} />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search employee name..."
                          value={empSearch}
                          onChange={(e) => setEmpSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, color: '#1a1a2e' }}
                        />
                      </div>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredEmployees.map(e => {
                        const checked = selectedEmployees.includes(e.employee_id);
                        return (
                          <div key={e.employee_id}
                            onClick={() => toggleEmployee(e.employee_id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                              cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                              background: checked ? 'rgba(5,150,105,0.05)' : 'transparent',
                            }}
                            onMouseEnter={(ev) => { if (!checked) ev.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={(ev) => { ev.currentTarget.style.background = checked ? 'rgba(5,150,105,0.05)' : 'transparent'; }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                              border: `2px solid ${checked ? '#059669' : '#d1d5db'}`,
                              background: checked ? '#059669' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>&#10003;</span>}
                            </div>
                            <div>
                              <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 500 }}>{e.name}</div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredEmployees.length === 0 && (
                        <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No employees found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Dealers Multi-Select */}
              <div style={{ position: 'relative' }} ref={dealerDropRef}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: '#374151', marginBottom: 6 }}>
                  Select Dealers ({selectedDealers.length} selected)
                </label>
                <div
                  onClick={() => {
                    setDealerDropdownOpen(!dealerDropdownOpen);
                    if (!dealerDropdownOpen) {
                      setTimeout(() => dealerDropRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
                    }
                  }}
                  style={{
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: '#fff', minHeight: 40,
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, flex: 1 }}>
                    {selectedDealers.length === 0 ? (
                      <span style={{ color: '#9ca3af', fontSize: 13 }}>Choose dealers...</span>
                    ) : (
                      selectedDealers.map(id => {
                        const dl = dealers.find(d => d.dealer_id === id);
                        return dl ? (
                          <span key={id} style={{
                            background: '#eef2ff', color: '#4f46e5', padding: '2px 8px', borderRadius: 12,
                            fontSize: 11, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 4,
                          }}>
                            {dl.name}
                            <span onClick={(e) => { e.stopPropagation(); toggleDealer(id); }}
                              style={{ cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>&times;</span>
                          </span>
                        ) : null;
                      })
                    )}
                  </div>
                  <FiChevronDown size={16} style={{
                    color: '#9ca3af', flexShrink: 0,
                    transform: dealerDropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s',
                  }} />
                </div>

                {dealerDropdownOpen && (
                  <div style={{
                    border: '1px solid #e5e7eb', borderRadius: 8, marginTop: 4, background: '#fff',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden',
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  }}>
                    <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        background: '#f9fafb', borderRadius: 6, padding: '6px 8px', border: '1px solid #e5e7eb',
                      }}>
                        <FiSearch size={14} style={{ color: '#9ca3af' }} />
                        <input
                          autoFocus
                          type="text"
                          placeholder="Search dealer name..."
                          value={dealerSearch}
                          onChange={(e) => setDealerSearch(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, flex: 1, color: '#1a1a2e' }}
                        />
                      </div>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                      {filteredDealers.map(d => {
                        const checked = selectedDealers.includes(d.dealer_id);
                        return (
                          <div key={d.dealer_id}
                            onClick={() => toggleDealer(d.dealer_id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                              cursor: 'pointer', borderBottom: '1px solid #f3f4f6',
                              background: checked ? 'rgba(79,70,229,0.05)' : 'transparent',
                            }}
                            onMouseEnter={(ev) => { if (!checked) ev.currentTarget.style.background = '#f9fafb'; }}
                            onMouseLeave={(ev) => { ev.currentTarget.style.background = checked ? 'rgba(79,70,229,0.05)' : 'transparent'; }}
                          >
                            <div style={{
                              width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                              border: `2px solid ${checked ? '#4f46e5' : '#d1d5db'}`,
                              background: checked ? '#4f46e5' : 'transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>&#10003;</span>}
                            </div>
                            <div>
                              <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 500 }}>{d.name}</div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredDealers.length === 0 && (
                        <div style={{ padding: 16, textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>No dealers found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '14px 20px', borderTop: '1px solid #e5e7eb',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
            }}>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAssign} disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update' : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast toast={toast} onClose={() => setToast(null)} />

      <ConfirmDialog
        open={!!confirmDialog}
        title="Delete Assignment"
        message={confirmDialog?.message}
        confirmText="Delete"
        variant="delete"
        onConfirm={confirmDialog?.onConfirm}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
};

export default AssignDealer;
