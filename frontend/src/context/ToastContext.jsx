import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', timeout = 4000, options = {}) => {
    const id = Date.now() + Math.random();
    const t = { 
      id, 
      message, 
      type,
      icon: options.icon,
      action: options.action,
      actionLabel: options.actionLabel,
      description: options.description
    };
    setToasts(s => [...s, t]);
    if (timeout > 0) setTimeout(() => setToasts(s => s.filter(x => x.id !== id)), timeout);
    return id;
  }, []);

  const removeToast = useCallback((id) => setToasts(s => s.filter(t => t.id !== id)), []);

  // Helpers pour types spécifiques
  const success = useCallback((msg, timeout, options) => addToast(msg, 'success', timeout, options), [addToast]);
  const error = useCallback((msg, timeout, options) => addToast(msg, 'error', timeout, options), [addToast]);
  const warning = useCallback((msg, timeout, options) => addToast(msg, 'warning', timeout, options), [addToast]);
  const info = useCallback((msg, timeout, options) => addToast(msg, 'info', timeout, options), [addToast]);
  const loading = useCallback((msg) => addToast(msg, 'loading', 0), [addToast]);

  const getIcon = (type) => {
    switch(type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'loading': return '⏳';
      default: return 'ℹ️';
    }
  };

  const getColor = (type) => {
    switch(type) {
      case 'success': return '#4caf50';
      case 'error': return '#f44336';
      case 'warning': return '#ff9800';
      case 'loading': return '#2196f3';
      default: return '#2196f3';
    }
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast, success, error, warning, info, loading }}>
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
              padding: '16px 20px', 
              borderRadius: 8, 
              marginBottom: 12, 
              minWidth: 300,
              maxWidth: 450,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              borderLeft: `5px solid ${getColor(t.type)}`,
              cursor: 'pointer',
              pointerEvents: 'auto',
              animation: 'slideInRight 0.3s ease-out',
              overflow: 'hidden'
            }}
          >
            <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: '2px' }}>{t.icon || getIcon(t.type)}</span>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{t.message}</span>
              {t.description && <span style={{ fontSize: '0.85rem', color: '#666' }}>{t.description}</span>}
              {t.action && (
                <button 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    t.action(); 
                    removeToast(t.id);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: getColor(t.type),
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    padding: '4px 0',
                    textAlign: 'left',
                    marginTop: '4px'
                  }}
                >
                  {t.actionLabel || 'Action'}
                </button>
              )}
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); removeToast(t.id); }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#999',
                lineHeight: 1,
                padding: 0,
                flexShrink: 0
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
