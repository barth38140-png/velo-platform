import React, { useState } from 'react';
import ComponentItem from './ComponentItem';
import AddComponentModal from './AddComponentModal';
import { bikeService } from '../services/api';
import { useConfirm } from '../context/ConfirmContext';
import { useToast } from '../context/ToastContext';

export default function BikeCard({ bike, onView, onUpdated }) {
  const [showAdd, setShowAdd] = useState(false);
  const { showConfirm } = useConfirm();
  const { addToast } = useToast();

  const handleDelete = async (componentId) => {
    const ok = await showConfirm({ title: 'Supprimer le composant', message: 'Voulez-vous vraiment supprimer ce composant ?', confirmText: 'Supprimer', cancelText: 'Annuler' });
    if (!ok) return;
    try {
      await bikeService.deleteComponent(componentId);
      onUpdated && onUpdated();
    } catch (err) {
      // Utiliser le logger Pino côté backend pour les erreurs de suppression de composant
      addToast(err?.response?.data?.error || 'Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="bike-card">
      <div className="bike-card-header">
        <div>
          <h3>{bike.name} <small>({bike.type})</small></h3>
          <div className="bike-meta">Taille: {bike.frame_size || '—'}</div>
        </div>
        <div className="bike-actions">
          <button className="btn" onClick={onView}>Voir</button>
          <button className="btn danger" style={{marginLeft:8}} onClick={async () => {
            const ok = await showConfirm({ title: 'Supprimer le vélo', message: 'Voulez-vous vraiment supprimer ce vélo et tous ses composants ?', confirmText: 'Supprimer le vélo', cancelText: 'Annuler' });
            if (!ok) return;
            try {
              await bikeService.deleteBike(bike.id);
              addToast('Le vélo a été supprimé avec succès.', 'success');
              onUpdated && onUpdated();
            } catch (err) {
              // Utiliser le logger Pino côté backend pour les erreurs de suppression de vélo
              addToast(err?.response?.data?.error || 'Erreur lors de la suppression du vélo', 'error');
            }
          }}>🗑 Supprimer le vélo</button>
        </div>
      </div>

      <div className="bike-components">
        <div className="components-header" style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <div><strong>Composants</strong></div>
          <div>
            <button className="btn small" onClick={() => setShowAdd(true)}>➕ Ajouter un composant</button>
          </div>
        </div>

        {(!bike.components || bike.components.length === 0) ? (
          <div className="empty-list">0 composants</div>
        ) : (
          <div className="components-list">
            {bike.components.map(c => (
              <div key={c.id} className="component-row">
                <ComponentItem component={c} />
                <div style={{marginLeft:8}}>
                  <button className="btn danger small" onClick={() => handleDelete(c.id)}>🗑 Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bike-footer">
        <small>{(bike.components || []).length} composants</small>
      </div>

      {showAdd && <AddComponentModal bikeId={bike.id} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); onUpdated && onUpdated(); }} />}
    </div>
  );
}
