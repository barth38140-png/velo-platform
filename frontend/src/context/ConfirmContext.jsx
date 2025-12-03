import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [conf, setConf] = useState(null);
  const [resolver, setResolver] = useState(null);

  const showConfirm = useCallback(({ title = 'Confirmer', message = '', confirmText = 'Confirmer', cancelText = 'Annuler' }) => {
    return new Promise((resolve) => {
      setConf({ title, message, confirmText, cancelText });
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = (result) => {
    if (resolver) resolver(result);
    setConf(null);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {conf && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal small" role="document" aria-labelledby="confirm-title">
            <h3 id="confirm-title">{conf.title}</h3>
            <div style={{marginTop:8}}>{conf.message}</div>
            <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
              <button className="btn secondary" onClick={() => handleClose(false)}>{conf.cancelText}</button>
              <button className="btn danger" onClick={() => handleClose(true)}>{conf.confirmText}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx;
}
