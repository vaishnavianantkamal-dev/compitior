import { X } from 'lucide-react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <header className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn sm" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>
        {children}
      </div>
    </div>
  );
}
