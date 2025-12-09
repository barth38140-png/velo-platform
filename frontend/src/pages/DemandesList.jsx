
// Mapping statut (base sans accent → affichage avec accent)
import React, { useState, useMemo } from 'react';
import { useRepairs } from '../hooks/useRepairs';
import { useToast } from '../context/ToastContext';
import RepairDetailModal from '../components/RepairDetailModal';

// Dictionnaire pour afficher les statuts avec accents et emoji
const statutLibelle = {
  'créée': { label: '📝 Créée', color: '#e0f7fa', text: '#00796b' },
  'en_attente': { label: '⏳ En attente', color: '#fffde7', text: '#ef6c00' },
  'assignée': { label: '👤 Assignée', color: '#e3f2fd', text: '#1976d2' },
  'en_cours': { label: '🔧 En cours', color: '#fff3e0', text: '#ef6c00' },
  'terminée': { label: '✅ Terminée', color: '#e8f5e9', text: '#388e3c' },
  'refusée': { label: '❌ Refusée', color: '#ffebee', text: '#b71c1c' },
  'annulée': { label: '🚫 Annulée', color: '#f3e5f5', text: '#6a1b9a' },
};

/**
 * Liste des demandes de réparation avec filtres et tri
 * @param {Object} props
 * @param {Array} props.repairs - Liste des demandes
 * @param {boolean} props.loading - Indique si les données sont en cours de chargement
 * @param {string|null} props.error - Message d'erreur éventuel
 * @param {function} props.onDelete - Callback pour supprimer une demande
 * @param {function} props.onSelect - Callback pour sélectionner une demande
 * @param {Object|null} props.selected - Demande sélectionnée
 * @param {Date|null} props.lastUpdated - Date de dernière mise à jour
 */
function DemandesList({
  repairs,
  loading,
  error,
  onDelete,
  onSelect,
  selected = null,
  lastUpdated = null
}) {
  // Si repairs/loading/error ne sont pas fournis, utiliser le hook
  const useHook = repairs === undefined || loading === undefined || error === undefined;
  const hookData = useHook ? useRepairs() : {};
  const _repairs = useHook ? hookData.repairs : repairs || [];
  const _loading = useHook ? hookData.loading : loading || false;
  const _error = useHook ? hookData.error : error || null;

  // Rafraîchit les demandes lors d'un changement de statut d'offre
  React.useEffect(() => {
    if (!useHook || !hookData.refresh) return;
    const handler = () => {
      hookData.refresh();
    };
    window.addEventListener('offerStatusChanged', handler);
    return () => window.removeEventListener('offerStatusChanged', handler);
  }, [useHook, hookData]);
  const { success, error: toastError } = useToast();
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [modalRepair, setModalRepair] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Gestion de la suppression d'une demande avec feedback
  const handleDelete = async (repair) => {
    if (window.confirm('Voulez-vous vraiment annuler cette demande ?')) {
      setDeletingId(repair.id);
      try {
        await onDelete(repair);
        success && success('Demande annulée avec succès');
      } catch (err) {
        toastError && toastError('Erreur lors de l\'annulation');
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Filtrage et tri des demandes
  const filteredAndSorted = useMemo(() => {
    let result = _repairs.map(r => ({
      ...r,
      status: (r.status && statutLibelle[r.status]) ? r.status : (r.status === 'cree' ? 'créée' : r.status)
    }));
    if (filterStatus !== 'all') {
      result = result.filter(r => r.status === filterStatus);
    }
    switch (sortBy) {
    case 'date-desc':
      result = [...result].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      break;
    case 'date-asc':
      result = [...result].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      break;
    case 'title':
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
      break;
    default:
      break;
    }
    return result;
  }, [repairs, filterStatus, sortBy]);

  const paginated = filteredAndSorted.slice(0, PAGE_SIZE * page);

  return (
    <div className="demandes-list" aria-live="polite">
      {modalRepair ? (
        <div className="repair-detail-wrapper">
          <button className="btn" style={{marginBottom:16}} onClick={() => setModalRepair(null)}>&larr; Retour à la liste</button>
          <RepairDetailModal repair={modalRepair} onClose={() => setModalRepair(null)} />
        </div>
      ) : (
        <>
          {/* Barre de filtres et tri */}
          <div className="list-controls">
            <div className="filter-group">
              <label htmlFor="status-filter">Statut:</label>
              <select
                id="status-filter"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
                className="filter-select"
              >
                <option value="all">Tous ({_repairs.length})</option>
                <option value="créée">📝 Créée ({_repairs.filter(r => (r.status === 'créée' || r.status === 'cree')).length})</option>
                <option value="en_attente">⏳ En attente ({_repairs.filter(r => r.status === 'en_attente').length})</option>
                <option value="assignée">👤 Assignée ({_repairs.filter(r => r.status === 'assignée').length})</option>
                <option value="en_cours">🔧 En cours ({_repairs.filter(r => r.status === 'en_cours').length})</option>
                <option value="terminée">✅ Terminée ({_repairs.filter(r => r.status === 'terminée').length})</option>
              </select>
            </div>
            <div className="sort-group">
              <label htmlFor="sort-select">Trier par:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="sort-select"
              >
                <option value="date-desc">Plus récente</option>
                <option value="date-asc">Plus ancienne</option>
                <option value="title">Titre (A-Z)</option>
              </select>
            </div>
            {lastUpdated && (
              <div className="actions-group" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="muted">Maj: {lastUpdated.toLocaleTimeString()}</span>
              </div>
            )}
          </div>
          {_error && <div className="error-toast small">{_error}</div>}
          {_loading ? <div className="loader-sm">Chargement...</div> : (
            paginated.length === 0 ? (
              <div className="empty-list">
                {filterStatus !== 'all' ? `Aucune demande avec le statut "${filterStatus}"` : 'Aucune demande pour l\'instant'}
              </div>
            ) : (
              <ul style={{ padding: 0, margin: 0 }}>
                {paginated.map(r => {
                  const stat = statutLibelle[r.status] || { label: r.status, color: '#eee', text: '#555' };
                  return (
                    <li key={r.id} className={`demand-item ${selected?.id === r.id ? 'selected' : ''}`}
                      style={{
                        background: selected?.id === r.id ? '#e6f6f2' : '#fff',
                        borderRadius: 10,
                        marginBottom: 10,
                        boxShadow: '0 1px 4px #0001',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        cursor: 'pointer',
                        border: selected?.id === r.id ? '2px solid #2a9d8f' : '1px solid #e0e0e0'
                      }}
                    >
                      <div className="demand-main" onClick={() => setModalRepair(r)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') setModalRepair(r); }} style={{ flex: 1, minWidth: 0 }}>
                        <div className="demand-title" style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                        <div className="demand-meta" style={{ fontSize: '0.97em', color: '#555', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 16 }}>📍</span> {r.location_address || 'Adresse inconnue'}</span>
                          <span style={{ color: '#888' }}>•</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ fontSize: 16 }}>📅</span> {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                          <span style={{ color: '#888' }}>•</span>
                          <span className={`status-badge status-${r.status}`} style={{ padding: '2px 10px', borderRadius: 8, background: stat.color, color: stat.text, fontWeight: 600 }}>{stat.label}</span>
                        </div>
                      </div>
                      <div className="demand-actions" style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end', minWidth: 90 }}>
                        <button className="btn small" style={{ marginBottom: 2 }} onClick={() => setModalRepair(r)}>Voir</button>
                        <button
                          className="btn danger small"
                          onClick={() => handleDelete(r)}
                          disabled={r.hasAcceptedOffer || deletingId === r.id}
                          title={r.hasAcceptedOffer ? 'Impossible d\'annuler : une offre a déjà été acceptée' : 'Annuler la demande'}
                          aria-disabled={r.hasAcceptedOffer}
                        >
                          {deletingId === r.id ? 'Annulation...' : 'Annuler'}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )
          )}
          {/* Pagination : bouton charger plus */}
          {paginated.length < filteredAndSorted.length && (
            <div style={{ textAlign: 'center', margin: '18px 0' }}>
              <button className="btn" onClick={() => setPage(page + 1)} tabIndex={0} aria-label="Charger plus de demandes">Charger plus</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DemandesList;




