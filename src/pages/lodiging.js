import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiCheck, FiClock, FiDownload, FiEye, FiRefreshCw, FiSave, FiTrash2, FiX, FiXCircle } from 'react-icons/fi';
import {
  deleteLodgingClaim,
  downloadLodgingClaimBill,
  getLodgingClaimById,
  getLodgingClaims,
  updateLodgingClaim,
  updateLodgingClaimStatus,
  viewLodgingClaimBill,
} from '../services/api';

const LIMIT = 10;

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
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewClaim, setViewClaim] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [savingAmount, setSavingAmount] = useState(false);
  const [billPreview, setBillPreview] = useState(null); // { url, type, name, blob }
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const filteredClaims = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return claims;
    return claims.filter((claim) => (
      getEmployeeName(claim).toLowerCase().includes(term) ||
      (claim.hotelName || '').toLowerCase().includes(term) ||
      String(claim.amount || '').includes(term)
    ));
  }, [claims, search]);

  // silent = background sync without the full-page loader (keeps open dialogs mounted)
  const fetchClaims = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await getLodgingClaims({ page, limit: LIMIT });
      const list = getListFromResponse(res.data);
      setClaims(list);
      setTotal(getTotalFromResponse(res.data, list.length));
    } catch (err) {
      console.error(err);
      if (!silent) alert(err.response?.data?.message || 'Failed to load lodging claims');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Revoke the preview object URL when the component unmounts.
  useEffect(() => () => {
    setBillPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  }, []);

  const applyStatus = async (id, status, action) => {
    try {
      await updateLodgingClaimStatus(id, { status, action });
      setClaims((prev) => prev.map((claim) => (
        claim.id === id ? { ...claim, status, action } : claim
      )));
      if (viewClaim?.id === id) {
        setViewClaim((prev) => ({ ...prev, status, action }));
      }
      fetchClaims(true); // silent background sync — dialog stays open on the same claim
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update lodging claim status');
    }
  };

  const handleApprove = async (id) => {
      await applyStatus(id, "approved", "Approved by admin");

      // Close the dialog after approval
      setViewClaim(null);
    };
  const handlePending = (id) => applyStatus(id, 'pending', 'Marked as pending');

  // Open the reason modal for rejection (reason is optional — admin decides).
  const openReject = (id) => {
    setRejectId(id);
    setRejectReason('');
  };

  const closeReject = () => {
    setRejectId(null);
    setRejectReason('');
  };

  const confirmReject = async () => {
  if (rejectId == null) return;

  await applyStatus(rejectId, "rejected", rejectReason.trim());

  // Close both dialogs
  closeReject();
  setViewClaim(null);
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
      const claim = getClaimFromResponse(res.data);
      setViewClaim(claim);
      setEditAmount(String(claim?.amount ?? ''));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to load lodging claim');
    }
  };

  const handleSaveAmount = async () => {
    if (!viewClaim) return;
    const amount = Number(editAmount);
    if (!editAmount || Number.isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    try {
      setSavingAmount(true);
      await updateLodgingClaim(viewClaim.id, { amount });
      setViewClaim((prev) => ({ ...prev, amount }));
      setClaims((prev) => prev.map((claim) => (
        claim.id === viewClaim.id ? { ...claim, amount } : claim
      )));
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update amount');
    } finally {
      setSavingAmount(false);
    }
  };

  const closeBillPreview = () => {
    setBillPreview((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
  };

  // Open the bill in an in-page dialog (image or PDF) instead of a new tab.
  const handleViewBill = async (claim) => {
    try {
      const res = await viewLodgingClaimBill(claim.id);
      const blob = res.data;
      const name = getBillName(claim);
      const type = blob?.type || '';
      const isPdf = type.includes('pdf') || /\.pdf$/i.test(name);
      // Revoke any previous preview URL before opening a new one.
      setBillPreview((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url);
        return { url: URL.createObjectURL(blob), type, name, blob, isPdf };
      });
    } catch (err) {
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
          <p className="lodging-subtitle">Review claims submitted from the mobile app, preview bills, and approve or reject them.</p>
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
                        <button className="icon-btn" onClick={() => handleApprove(claim.id)} title="Approve"><FiCheck /></button>
                        <button className="icon-btn danger" onClick={() => openReject(claim.id)} title="Reject"><FiXCircle /></button>
                        <button className="icon-btn" onClick={() => handlePending(claim.id)} title="Mark Pending"><FiClock /></button>
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

      {viewClaim && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="panel-header">
              <h3>Lodging Claim #{viewClaim.id} — {getEmployeeName(viewClaim)}</h3>
              <button className="icon-btn" onClick={() => setViewClaim(null)}><FiX /></button>
            </div>
            <div className="panel-body">
              <div className="preview-grid" style={{ flexWrap: 'wrap' }}>
                <div className="preview-item"><span>Employee:</span><strong>{getEmployeeName(viewClaim)}</strong></div>
                <div className="preview-item"><span>Hotel:</span><strong>{viewClaim.hotelName || '-'}</strong></div>
                <div className="preview-item"><span>Date:</span><strong>{formatDate(viewClaim.claimDate || viewClaim.date || viewClaim.createdAt)}</strong></div>
                <div className="preview-item"><span>Status:</span><strong>{toTitle(viewClaim.status)}</strong></div>
                <div className="preview-item"><span>Action:</span><strong>{viewClaim.action || viewClaim.remarks || '-'}</strong></div>
              </div>

              <div className="form-group" style={{ marginTop: 16 }}>
                <label>Claim Amount (editable)</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveAmount}
                    disabled={savingAmount || String(editAmount) === String(viewClaim.amount ?? '')}
                  >
                    <FiSave /> {savingAmount ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
              <div className="panel-footer">
                <button className="btn btn-secondary" onClick={() => handleViewBill(viewClaim)}><FiEye /> Preview Bill</button>
                <button className="btn btn-secondary" onClick={() => handleDownloadBill(viewClaim)}><FiDownload /> Download Bill</button>
                <button className="btn btn-primary" onClick={() => handleApprove(viewClaim.id)}><FiCheck /> Approve</button>
                <button className="btn" style={{ background: '#ef4444' }} onClick={() => openReject(viewClaim.id)}><FiXCircle /> Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {billPreview && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 820, width: '92%' }}>
            <div className="panel-header">
              <h3>Bill Preview</h3>
              <button className="icon-btn" onClick={closeBillPreview}><FiX /></button>
            </div>
            <div className="panel-body">
              {billPreview.isPdf ? (
                <iframe
                  title="Bill preview"
                  src={billPreview.url}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 6, background: '#fff' }}
                />
              ) : (
                <img
                  src={billPreview.url}
                  alt="Bill preview"
                  style={{ width: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 6, background: '#fff' }}
                />
              )}
              <div className="panel-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => downloadBlob(billPreview.blob, ensureFileExtension(billPreview.name, billPreview.blob))}
                >
                  <FiDownload /> Download
                </button>
                <button className="btn btn-secondary" onClick={closeBillPreview}><FiX /> Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {rejectId != null && (
        <div className="modal-overlay">
          <div className="modal-container" style={{ maxWidth: 460, width: '90%' }}>
            <div className="panel-header">
              <h3>Reject Claim #{rejectId}</h3>
              <button className="icon-btn" onClick={closeReject}><FiX /></button>
            </div>
            <div className="panel-body">
              <div className="form-group">
                <label>Reason for rejection (optional)</label>
                <textarea
                  rows={4}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Leave blank if no reason"
                  style={{ width: '100%', resize: 'vertical' }}
                />
              </div>
              <div className="panel-footer">
                <button className="btn btn-secondary" onClick={closeReject}>Cancel</button>
                <button className="btn" style={{ background: '#ef4444' }} onClick={confirmReject}><FiXCircle /> Reject</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LodgingClaims;
