import { useEffect } from 'react';

const ICONS = { info: 'ℹ️', success: '✅', warning: '⚠️', critical: '🚨' };

export function ToastContainer({ toasts, onClose }) {
  if (!toasts.length) return null;
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <Toast key={t.id} toast={t} onClose={() => onClose(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 6000);
    return () => clearTimeout(timer);
  }, [onClose, toast.duration]);

  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">{ICONS[toast.type] || 'ℹ️'}</span>
      <div className="toast-body">
        {toast.title && <div className="toast-title">{toast.title}</div>}
        <div className="toast-msg">{toast.message}</div>
      </div>
      <button className="toast-close" onClick={onClose}>✕</button>
    </div>
  );
}
