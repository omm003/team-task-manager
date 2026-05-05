import { useState, useEffect, useRef } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ children, variant = "primary", size = "md", loading, className = "", ...props }) {
  const base = `btn btn-${variant} btn-${size} ${className}`;
  return (
    <button className={base} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : children}
    </button>
  );
}

// ─── Input ────────────────────────────────────────────────────────────────────
export function Input({ label, error, className = "", ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <input className={`field-input ${error ? "field-input--error" : ""}`} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
export function Textarea({ label, error, className = "", ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <textarea className={`field-input ${error ? "field-input--error" : ""}`} rows={3} {...props} />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, error, children, className = "", ...props }) {
  return (
    <div className={`field ${className}`}>
      {label && <label className="field-label">{label}</label>}
      <select className={`field-input ${error ? "field-input--error" : ""}`} {...props}>
        {children}
      </select>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal fade-in">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ children, color = "default" }) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}

// ─── Toast system ─────────────────────────────────────────────────────────────
let toastFn = null;
export function toast(msg, type = "success") {
  if (toastFn) toastFn(msg, type);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    toastFn = (msg, type) => {
      const id = Date.now();
      setToasts((p) => [...p, { id, msg, type }]);
      setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
    };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {t.type === "success" ? <CheckCircle size={14} style={{ color: "var(--green)", marginRight: 8 }} /> 
                                : <AlertCircle size={14} style={{ color: "var(--red)", marginRight: 8 }} />}
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, className = "", ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function Empty({ icon: Icon, title, message, action }) {
  return (
    <div className="empty">
      {Icon && <div className="empty-icon"><Icon size={32} /></div>}
      <div className="empty-title">{title}</div>
      {message && <div className="empty-message">{message}</div>}
      {action}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p style={{ color: "var(--text2)", marginBottom: 20 }}>{message}</p>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant={danger ? "danger" : "primary"} onClick={() => { onConfirm(); onClose(); }}>
          Confirm
        </Button>
      </div>
    </Modal>
  );
}
