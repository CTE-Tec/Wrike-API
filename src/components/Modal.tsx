import { useEffect, useRef } from 'react';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function Modal({ show, onClose, title, subtitle, children, actions }: ModalProps) {
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      ref={bgRef}
      className={`mdl-bg ${show ? 'show' : ''}`}
      onClick={(e) => { if (e.target === bgRef.current) onClose(); }}
    >
      <div className="mdl">
        <button className="mdl-x" onClick={onClose}>&#10005;</button>
        <h2 className="text-[16px] font-bold mb-[3px]">{title}</h2>
        {subtitle && <div className="mdl-sub">{subtitle}</div>}
        <div>{children}</div>
        {actions && <div className="mdl-acts">{actions}</div>}
      </div>
    </div>
  );
}
