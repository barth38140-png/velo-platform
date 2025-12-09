import React, { useRef, useEffect } from 'react';

/**
 * Composant Drawer fluide et accessible
 * Props : children, onClose
 */
function Drawer({ children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
      ref.current.scrollTop = 0;
    }
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKey = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = orig;
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      className="drawer"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '420px',
        maxWidth: '100vw',
        height: '100vh',
        background: '#fff',
        boxShadow: '-2px 0 16px rgba(0,0,0,0.12)',
        zIndex: 1000,
        overflowY: 'auto',
        transition: 'transform 0.3s cubic-bezier(.4,2,.6,1)',
        outline: 'none'
      }}
      aria-modal="true"
      role="dialog"
    >
      <button
        className="btn"
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
        onClick={onClose}
        aria-label="Fermer le détail"
      >
        ×
      </button>
      <div style={{ padding: '32px 24px 24px 24px' }}>
        {children}
      </div>
    </div>
  );
}

export default Drawer;
