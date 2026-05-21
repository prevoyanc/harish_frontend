import { useEffect } from 'react';
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

const styles = {
  success: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', icon: '#059669' },
  error: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b', icon: '#dc2626' },
};

const Toast = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const s = styles[toast.type] || styles.error;
  const Icon = toast.type === 'success' ? FiCheckCircle : FiAlertCircle;

  return (
    <>
      <div style={{
        position: 'fixed', top: 24, right: 24, zIndex: 999,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 20px', borderRadius: 10,
        background: s.bg, border: `1px solid ${s.border}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        animation: 'toastSlideIn 0.3s ease',
      }}>
        <Icon size={18} style={{ color: s.icon, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: s.color }}>{toast.message}</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 8,
          color: s.icon, fontSize: 18, lineHeight: 1, display: 'flex',
        }}><FiX size={16} /></button>
      </div>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Toast;
