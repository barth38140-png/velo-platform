import React, { useEffect, useState, useCallback } from 'react';
import { repairService } from '../services/api';
import RepairDetailModal from '../components/RepairDetailModal';
import OfferBadge from '../components/OfferBadge';
import { useToast } from '../context/ToastContext';
import '../styles/ListControls.css';

export default function DemandesList({ onSelect, selected }) {
	const [repairs, setRepairs] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [filterStatus, setFilterStatus] = useState('all');
	const [sortBy, setSortBy] = useState('date-desc');
	const [lastUpdated, setLastUpdated] = useState(null);
	const toast = useToast();
	const renderCount = React.useRef(0);
	const prevRepairsRef = React.useRef('');

	const loadRepairs = useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const resp = await repairService.getMyRepairs();
			const list = resp?.data?.repairs || [];
			// Filter out cancelled requests (statut normalisé en français)
			const filtered = list.filter(r => r.status !== 'annulée');
			// The backend now provides a `hasAcceptedOffer` flag per repair; use it directly
			const normalized = filtered.map(r => ({ ...r, hasAcceptedOffer: !!r.hasAcceptedOffer }));
			
			// ⚡ Éviter mises à jour inutiles si la liste n'a pas changé
			const nextIds = normalized.map(r => `${r.id}-${r.status}-${r.hasAcceptedOffer}`).join(',');
			const hasChanged = prevRepairsRef.current !== nextIds;
			
			if (hasChanged) {
				prevRepairsRef.current = nextIds;
				setRepairs(normalized);
				setLastUpdated(new Date());
				if (!selected && normalized.length > 0) onSelect && onSelect(normalized[0]);
			}
		} catch (err) {
			// Ne pas afficher d'erreur au montage si 404 ou aucune donnée
			if (err?.response?.status === 404) {
				setRepairs([]);
				setLastUpdated(new Date());
			}
		} finally {
			setLoading(false);
		}
	}, [onSelect, selected]);

	// Rafraîchir au fur et à mesure des choix utilisateur
	// 1) Quand l'utilisateur change le filtre ou le tri
	useEffect(() => {
		// Charger immédiatement à l'ouverture et à chaque changement de filtre/tri
		loadRepairs();
	}, [filterStatus, sortBy, loadRepairs]);
	// 2) Quand la fenêtre retrouve le focus (navigation retour) - throttle pour éviter spam
	useEffect(() => {
		let throttleTimer = null;
		function onFocus() {
			if (throttleTimer) return;
			throttleTimer = setTimeout(() => { throttleTimer = null; }, 3000);
			loadRepairs();
		}
		window.addEventListener('focus', onFocus);
		return () => {
			window.removeEventListener('focus', onFocus);
			if (throttleTimer) clearTimeout(throttleTimer);
		};
	}, [loadRepairs]);

	useEffect(() => {
		// Refresh repairs when offers or repairs change elsewhere in the app
		const handler = () => { try { loadRepairs(); } catch { } };
		window.addEventListener('offerStatusChanged', handler);
		window.addEventListener('repairCreated', handler);
		return () => { window.removeEventListener('offerStatusChanged', handler); window.removeEventListener('repairCreated', handler); };
	}, [loadRepairs, repairs]);

	const handleDelete = async (r) => {
		// Prevent client-side deletion if an accepted offer exists
		if (r.hasAcceptedOffer) {
			setError("Impossible d'annuler : une offre a déjà été acceptée pour cette demande");
			return;
		}
		if (!window.confirm('Confirmer la suppression de la demande ?')) return;
		try {
			await repairService.updateRepairStatus(r.id, 'annulée');
			toast.success('✅ Demande annulée avec succès');
			await loadRepairs();
			if (selected?.id === r.id) onSelect && onSelect(null);
		} catch (err) {
			console.error('delete', err);
			const errorMsg = err?.response?.data?.error || 'Impossible de supprimer la demande';
			setError(errorMsg);
			toast.error('❌ ' + errorMsg);
		}
	};

	const [modalRepair, setModalRepair] = useState(null);

	// Filtrage et tri
	const filteredAndSorted = React.useMemo(() => {
		let result = [...repairs];
		
		// Filtrage par statut
		if (filterStatus !== 'all') {
			result = result.filter(r => r.status === filterStatus);
		}
		
		// Tri
		switch (sortBy) {
			case 'date-desc':
				result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
				break;
			case 'date-asc':
				result.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
				break;
			case 'title':
				result.sort((a, b) => a.title.localeCompare(b.title));
				break;
			default:
				break;
		}
		
		return result;
	}, [repairs, filterStatus, sortBy]);

	return (
		<>
			<div className="demandes-list" aria-live="polite">
			{/* Barre de filtres et tri */}
			<div className="list-controls">
				<div className="filter-group">
					<label htmlFor="status-filter">Statut:</label>
					<select 
						id="status-filter"
						value={filterStatus} 
						onChange={(e) => setFilterStatus(e.target.value)}
						className="filter-select"
					>
						<option value="all">Tous ({repairs.length})</option>
						<option value="créée">📝 Créée ({repairs.filter(r => r.status === 'créée').length})</option>
						<option value="en_attente">⏳ En attente ({repairs.filter(r => r.status === 'en_attente').length})</option>
						<option value="assignée">👤 Assignée ({repairs.filter(r => r.status === 'assignée').length})</option>
						<option value="en_cours">🔧 En cours ({repairs.filter(r => r.status === 'en_cours').length})</option>
						<option value="terminée">✅ Terminée ({repairs.filter(r => r.status === 'terminée').length})</option>
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
			{error && <div className="error-toast small">{error}</div>}
			{loading ? <div className="loader-sm">Chargement...</div> : (
				filteredAndSorted.length === 0 ? (
					<div className="empty-list">
						{filterStatus !== 'all' ? `Aucune demande avec le statut "${filterStatus}"` : 'Aucune demande pour l\'instant'}
					</div>
				) : (
					<ul>
						{filteredAndSorted.map(r => (
							<li key={r.id} className={`demand-item ${selected?.id === r.id ? 'selected' : ''}`}>
								<div className="demand-main" onClick={() => onSelect && onSelect(r)} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') onSelect&&onSelect(r); }}>
									<div className="demand-title">{r.title}</div>
									<div className="demand-meta">{r.location_address || 'Adresse inconnue'} • {r.created_at ? new Date(r.created_at).toLocaleDateString() : ''} • <span className={`status ${r.status}`}>{r.status}</span></div>
								</div>
								<div className="demand-actions">
									<button className="btn small" onClick={() => setModalRepair(r)}>Voir</button>
									<button
										className="btn danger small"
										onClick={() => handleDelete(r)}
										disabled={r.hasAcceptedOffer}
										title={r.hasAcceptedOffer ? "Impossible d'annuler : une offre a déjà été acceptée" : 'Annuler la demande'}
										aria-disabled={r.hasAcceptedOffer}
									>
										Annuler
									</button>
								</div>
							</li>
						))}
					</ul>
				)
			)}
			</div>
			{modalRepair && <RepairDetailModal repair={modalRepair} onClose={() => setModalRepair(null)} />}
		</>
	);
}

// render modal outside (component returns it as sibling)
export function DemandesListWithModal(props) {
	return (
		<div>
			<DemandesList {...props} />
		</div>
	);
}
