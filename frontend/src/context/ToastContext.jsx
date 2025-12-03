import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', timeout = 4000) => {
    const id = Date.now() + Math.random();
    const t = { id, message, type };
    setToasts(s => [...s, t]);
    if (timeout > 0) setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), timeout);
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts(s => s.filter(t => t.id !== id)), []);

  // Helpers pour types spécifiques
  const success = useCallback((msg, timeout) => addToast(msg, 'success', timeout), [addToast]);
  const error = useCallback((msg, timeout) => addToast(msg, 'error', timeout), [addToast]);
  const warning = useCallback((msg, timeout) => addToast(msg, 'warning', timeout), [addToast]);
  const info = useCallback((msg, timeout) => addToast(msg, 'info', timeout), [addToast]);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      default: return '#2196f3';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info }}>
      {children}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'fixed', right: 16, top: 80, zIndex: 1050, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div 
            key={t.id} 
            className={`toast toast-${t.type}`} 
            onClick={() => removeToast(t.id)}
            style={{ 
              background: 'white',
              color: '#333', 
              padding: '12px 16px', 
              borderRadius: 8, 
              marginBottom: 12, 
              minWidth: 280,
              maxWidth: 400,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderLeft: `4px solid ${getColor(t.type)}`,
              cursor: 'pointer',
              pointerEvents: 'auto',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>{getIcon(t.type)}</span>
            <span style={{ flex: 1, fontSize: '0.95rem' }}>{t.message}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#999',
                lineHeight: 1,
                padding: 0
              }}
            >×</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
