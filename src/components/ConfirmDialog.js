import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';

const icons = {
  delete: { icon: FiTrash2, bg: '#fef2f2', color: '#dc2626' },
  warning: { icon: FiAlertTriangle, bg: '#fffbeb', color: '#d97706' },
};

const ConfirmDialog = ({ open, title, message, confirmText = 'Delete', variant = 'delete', onConfirm, onCancel }) => {
  if (!open) return null;

  const { icon: Icon, bg, color } = icons[variant] || icons.delete;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 12, width: 400, maxWidth: '90%',
        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
      }}>
        <div style={{ padding: '24px 24px 16px', textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
            background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={22} style={{ color }} />
          </div>
          <h3 style={{ margin: '0 0 8px', fontSize: 16, color: '#1a1a2e' }}>{title}</h3>
          <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{message}</p>
        </div>
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #e5e7eb',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
        }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button
            className="btn"
            style={{ background: color, color: '#fff', border: 'none' }}
            onClick={onConfirm}
          >{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
