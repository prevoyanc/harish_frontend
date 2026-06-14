import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiArrowLeft, FiCheck, FiClock, FiDownload, FiEye, FiPlus, FiRefreshCw, FiTrash2, FiX, FiXCircle } from 'react-icons/fi';
import {
  createLodgingClaim,
  deleteLodgingClaim,
  downloadLodgingClaimBill,
  getLodgingClaimById,
  getLodgingClaims,
  updateLodgingClaimStatus,
  viewLodgingClaimBill,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

const LIMIT = 10;
const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user')) || null;
  } catch {
    return null;
  }
};

const getListFromResponse = (data) => {
  if (Array.isArray(data)) return data;
  return data?.lodgingClaims || data?.claims || data?.data || data?.rows || [];
};

const getTotalFromResponse = (data, fallback) => (
  data?.total || data?.count || data?.pagination?.total || data?.meta?.total || fallback
);

const getClaimFromResponse = (data) => data?.lodgingClaim || data?.claim || data?.data || data;

const toTitle = (value) => {
  if (!value) return 'Pending';
  return String(value).charAt(0).toUpperCase() + String(value).slice(1).toLowerCase();
};

const formatDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const getEmployeeName = (claim) => (
  claim.employeeName ||
  claim.employee?.user?.name ||
  claim.employee?.name ||
  claim.user?.name ||
  claim.userName ||
  (claim.userId ? `User #${claim.userId}` : '-')
);

const getBillName = (claim) => {
  return (
    claim.billName ||
    claim.billOriginalName ||
    claim.billFileName ||
    claim.billUrl?.split?.(/[\\/]/).pop() ||
    claim.bill?.split?.(/[\\/]/).pop() ||
    `lodging-claim-${claim.id || 'bill'}`
  );
};

const isPdfFile = (fileOrUrl) => {
  const value = typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl?.name || fileOrUrl?.type || '';
  return value.toLowerCase().includes('pdf');
};

const isImageFile = (fileOrUrl) => {
  const value = typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl?.name || fileOrUrl?.type || '';
  return /image|\.webp|\.png|\.jpe?g|\.gif|\.bmp/i.test(value);
};

const getFileNameFromHeaders = (headers, fallback) => {
  const disposition = headers?.['content-disposition'] || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
};

const ensureFileExtension = (fileName, blob) => {
  if (/\.[a-z0-9]+$/i.test(fileName)) return fileName;
  const type = blob?.type || '';
  if (type.includes('pdf')) return `${fileName}.pdf`;
  if (type.includes('png')) return `${fileName}.png`;
  if (type.includes('jpeg') || type.includes('jpg')) return `${fileName}.jpg`;
  if (type.includes('webp')) return `${fileName}.webp`;
  return fileName;
};

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const LodgingClaims = () => {
  const { user } = useAuth();
  const activeUser = user || getStoredUser();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [viewClaim, setViewClaim] = useState(null);
  const [billPreviewUrl, setBillPreviewUrl] = useState('');
  const [form, setForm] = useState({
    userId: activeUser?.id || '',
    hotelName: '',
    amount: '',
    claimDate: new Date().toISOString().split('T')[0],
    bill: null,
  });

  const filteredClaims = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return claims;
    return claims.filter((claim) => (
      getEmployeeName(claim).toLowerCase().includes(term) ||
      (claim.hotelName || '').toLowerCase().includes(term) ||
      String(claim.amount || '').includes(term)
    ));
  }, [claims, search]);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getLodgingClaims({ page, limit: LIMIT });
      const list = getListFromResponse(res.data);
      setClaims(list);
      setTotal(getTotalFromResponse(res.data, list.length));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to load lodging claims');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const resetForm = () => {
    if (billPreviewUrl) URL.revokeObjectURL(billPreviewUrl);
    setBillPreviewUrl('');
    setForm({
      userId: activeUser?.id || '',
      hotelName: '',
      amount: '',
      claimDate: new Date().toISOString().split('T')[0],
      bill: null,
    });
  };

  useEffect(() => () => {
    if (billPreviewUrl) URL.revokeObjectURL(billPreviewUrl);
  }, [billPreviewUrl]);

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleBillChange = (file) => {
    if (billPreviewUrl) URL.revokeObjectURL(billPreviewUrl);
    setForm({ ...form, bill: file || null });
    setBillPreviewUrl(file ? URL.createObjectURL(file) : '');
  };

  const handleCreate = async () => {
    if (!form.userId || !form.hotelName || !form.amount || !form.claimDate || !form.bill) {
      alert('Please fill user, hotel, amount, claim date, and bill');
      return;
    }

    const payload = new FormData();
    payload.append('userId', form.userId);
    payload.append('hotelName', form.hotelName);
    payload.append('amount', form.amount);
    payload.append('claimDate', form.claimDate);
    payload.append('bill', form.bill);

    try {
      setSaving(true);
      await createLodgingClaim(payload);
      setShowModal(false);
      resetForm();
      if (page === 1) fetchClaims();
      else setPage(1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to create lodging claim');
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (id, status) => {
    const action =
      status === 'approved'
        ? 'Approved by admin'
        : status === 'rejected'
          ? window.prompt('Reason for rejection', 'Bill is invalid')
          : 'Marked as pending';

    if (action === null) return;

    try {
      await updateLodgingClaimStatus(id, { status, action });
      setClaims((prev) => prev.map((claim) => (
        claim.id === id ? { ...claim, status, action } : claim
      )));
      if (viewClaim?.id === id) {
        setViewClaim((prev) => ({ ...prev, status, action }));
      }
      fetchClaims();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update lodging claim status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lodging claim?')) return;
    try {
      await deleteLodgingClaim(id);
      fetchClaims();
      if (viewClaim?.id === id) setViewClaim(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete lodging claim');
    }
  };

  const openClaim = async (id) => {
    try {
      const res = await getLodgingClaimById(id);
      setViewClaim(getClaimFromResponse(res.data));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to load lodging claim');
    }
  };

  const handleViewBill = async (claim) => {
    const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
    try {
      const res = await viewLodgingClaimBill(claim.id);
      const url = URL.createObjectURL(res.data);
      if (previewWindow) {
        previewWindow.location.href = url;
      } else {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      if (previewWindow) previewWindow.close();
      console.error(err);
      alert(err.response?.data?.message || 'Failed to preview lodging bill');
    }
  };

  const handleDownloadBill = async (claim) => {
    try {
      const res = await downloadLodgingClaimBill(claim.id);
      const fileName = ensureFileExtension(
        getFileNameFromHeaders(res.headers, getBillName(claim)),
        res.data,
      );
      downloadBlob(res.data, fileName);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to download lodging bill');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  if (loading) return <div className="loading loading-full">Loading lodging claims...</div>;

  return (
    <div className="lodging-page">
      <div className="lodging-header">
        <div>
          <h2 className="page-title">Lodging Claims</h2>
          <p className="lodging-subtitle">Review claims, preview bills, and approve or reject them from one place.</p>
        </div>
      </div>

      <div className="toolbar lodging-toolbar">
        <input
          type="text"
          placeholder="Search employee, hotel, amount..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <button
          className="btn btn-primary"
          onClick={openModal}
        >
          <FiPlus /> Add Claim
        </button>
        <button className="btn btn-secondary" onClick={fetchClaims}><FiRefreshCw /> Refresh</button>
      </div>

      <div className="table-container lodging-table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Employee</th>
              <th>Hotel</th>
              <th>Amount</th>
              <th>Bill</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClaims.length === 0 ? (
              <tr><td colSpan="8" style={{ textAlign: 'center' }}>No lodging claims found</td></tr>
            ) : (
              filteredClaims.map((claim) => {
                const status = String(claim.status || 'pending').toLowerCase();
                return (
                  <tr key={claim.id}>
                    <td>#{claim.id}</td>
                    <td>{getEmployeeName(claim)}</td>
                    <td>{claim.hotelName || '-'}</td>
                    <td>Rs. {Number(claim.amount || 0).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="icon-btn" onClick={() => handleViewBill(claim)} title="View Bill"><FiEye /></button>
                        <button className="icon-btn" onClick={() => handleDownloadBill(claim)} title="Download Bill"><FiDownload /></button>
                      </div>
                    </td>
                    <td>{formatDate(claim.claimDate || claim.date || claim.createdAt)}</td>
                    <td><span className={`badge badge-${status}`}>{toTitle(status)}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        <button className="icon-btn" onClick={() => openClaim(claim.id)} title="View Claim"><FiEye /></button>
                        <button className="icon-btn" onClick={() => handleStatus(claim.id, 'approved')} title="Approve"><FiCheck /></button>
                        <button className="icon-btn danger" onClick={() => handleStatus(claim.id, 'rejected')} title="Reject"><FiXCircle /></button>
                        <button className="icon-btn" onClick={() => handleStatus(claim.id, 'pending')} title="Mark Pending"><FiClock /></button>
                        <button className="icon-btn danger" onClick={() => handleDelete(claim.id)} title="Delete"><FiTrash2 /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div className="pagination">
          <span>Total: {total} lodging claims</span>
          <div className="page-btns">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
            <button className="page-btn active">{page}</button>
            <button className="page-btn" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="panel-header">
              <h3>Add Lodging Claim</h3>
              <button className="icon-btn" onClick={closeModal} title="Close">
                <FiX />
              </button>
            </div>
            <div className="panel-body">
              <div className="form-group">
                <label>User ID *</label>
                <input
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Hotel Name *</label>
                <input
                  value={form.hotelName}
                  onChange={(e) => setForm({ ...form, hotelName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Amount *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Claim Date *</label>
                <input
                  type="date"
                  value={form.claimDate}
                  onChange={(e) => setForm({ ...form, claimDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Upload Bill *</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleBillChange(e.target.files[0])}
                />
              </div>
              {billPreviewUrl && (
                <div className="form-group">
                  <label>Bill Preview</label>
                  <div className="bill-preview-box">
                    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => window.open(billPreviewUrl, '_blank', 'noopener,noreferrer')}
                      >
                        <FiEye /> Preview
                      </button>
                      <a
                        className="btn btn-secondary btn-sm"
                        href={billPreviewUrl}
                        download={form.bill?.name || 'lodging-bill'}
                      >
                        <FiDownload /> Download
                      </a>
                    </div>
                    {isImageFile(form.bill) && (
                      <img src={billPreviewUrl} alt="Bill preview" style={{ width: '100%', maxHeight: 260, objectFit: 'contain', borderRadius: 6, background: '#fff' }} />
                    )}
                    {isPdfFile(form.bill) && (
                      <iframe title="Bill preview" src={billPreviewUrl} style={{ width: '100%', height: 260, border: 'none', borderRadius: 6, background: '#fff' }} />
                    )}
                  </div>
                </div>
              )}
              <div className="panel-footer">
                <button className="btn btn-secondary" onClick={closeModal}>
                  <FiArrowLeft /> Back
                </button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                  {saving ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewClaim && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="panel-header">
              <h3>Lodging Claim #{viewClaim.id}</h3>
              <button className="icon-btn" onClick={() => setViewClaim(null)}><FiX /></button>
            </div>
            <div className="panel-body">
              <div className="preview-grid" style={{ flexWrap: 'wrap' }}>
                <div className="preview-item"><span>Employee:</span><strong>{getEmployeeName(viewClaim)}</strong></div>
                <div className="preview-item"><span>Hotel:</span><strong>{viewClaim.hotelName || '-'}</strong></div>
                <div className="preview-item"><span>Amount:</span><strong>Rs. {Number(viewClaim.amount || 0).toLocaleString()}</strong></div>
                <div className="preview-item"><span>Date:</span><strong>{formatDate(viewClaim.claimDate || viewClaim.date || viewClaim.createdAt)}</strong></div>
                <div className="preview-item"><span>Status:</span><strong>{toTitle(viewClaim.status)}</strong></div>
                <div className="preview-item"><span>Action:</span><strong>{viewClaim.action || viewClaim.remarks || '-'}</strong></div>
              </div>
              <div className="panel-footer">
                <button className="btn btn-secondary" onClick={() => handleViewBill(viewClaim)}><FiEye /> Preview Bill</button>
                <button className="btn btn-secondary" onClick={() => handleDownloadBill(viewClaim)}><FiDownload /> Download Bill</button>
                <button className="btn btn-primary" onClick={() => handleStatus(viewClaim.id, 'approved')}><FiCheck /> Approve</button>
                <button className="btn" style={{ background: '#ef4444' }} onClick={() => handleStatus(viewClaim.id, 'rejected')}><FiXCircle /> Reject</button>
                <button className="btn btn-secondary" onClick={() => handleStatus(viewClaim.id, 'pending')}><FiClock /> Pending</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LodgingClaims;
