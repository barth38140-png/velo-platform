import React, { useState } from 'react';
import { bikeService } from '../services/api';

export default function AddComponentModal({ bikeId, onClose, onAdded }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('chaine');
  const [installedAt, setInstalledAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const types = [
    { key: 'chaine', label: 'Chaîne' },
    { key: 'freins', label: 'Freins' },
    { key: 'pneus', label: 'Pneus' },
    { key: 'transmission', label: 'Transmission' },
    { key: 'autre', label: 'Autre' }
  ];

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError('');
    if (!name) return setError('Le nom du composant est requis');
    setLoading(true);
    try {
      const payload = { name, type, installed_at: installedAt || null };
      await bikeService.createComponent(bikeId, payload);
      onAdded && onAdded();
      onClose && onClose();
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs de création de composant
      setError(err?.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal small">
        <h3>➕ Ajouter un composant</h3>
        {error && <div className="field-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <label className="label">Nom du composant</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />

          <label className="label">Type</label>
          <div style={{display:'flex', gap:8, flexWrap:'wrap', marginBottom:8}}>
            {types.map(t => (
              <button key={t.key} type="button" className={`chip ${type===t.key? 'active':''}`} onClick={() => setType(t.key)}>{t.label}</button>
            ))}
          </div>

          <label className="label">Date d'installation</label>
          <input type="date" value={installedAt} onChange={(e) => setInstalledAt(e.target.value)} />

          <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:12}}>
            <button type="button" className="btn secondary" onClick={onClose}>Annuler</button>
            <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Ajout...' : 'Ajouter'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
