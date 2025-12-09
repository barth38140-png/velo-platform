import RepairersMap from './RepairersMap';
import useRepairers from '../hooks/useRepairers';
import useAutocomplete from '../hooks/useAutocomplete';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
export { Repairers };
// Composant principal Repairers (squelette minimal pour restauration)
function Repairers() {
	const navigate = useNavigate();
		// Chargement des réparateurs au montage
		useEffect(() => {
			let mounted = true;
			setLoading(true);
			import('../services/api').then(({ repairerService }) => {
				repairerService.getAllRepairers()
					.then(res => {
						if (mounted) setRepairers(res.data.repairers || []);
					})
					.catch(err => {
						setError('Impossible de charger les réparateurs');
					})
					.finally(() => {
						if (mounted) setLoading(false);
					});
			});
			return () => { mounted = false; };
		}, []);
	// Hooks et logique métier
	const { user, profile } = useAuth();
	const { toastError } = useToast();
	const [repairers, setRepairers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [selected, setSelected] = useState(null);
	const [selectedProfile, setSelectedProfile] = useState(null);
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [query, setQuery] = useState(() => localStorage.getItem('repairers_query') || '');
	const [nearbyOnly, setNearbyOnly] = useState(() => {
		const v = localStorage.getItem('repairers_nearbyOnly');
		return v === null ? false : v === 'true';
	});
	const [sortBy, setSortBy] = useState(() => localStorage.getItem('repairers_sortBy') || 'rating');
	const [distanceAsc, setDistanceAsc] = useState(() => {
		const v = localStorage.getItem('repairers_distanceAsc');
		return v === null ? true : v === 'true';
	});
	const [onlyAvailable, setOnlyAvailable] = useState(() => {
		const v = localStorage.getItem('repairers_onlyAvailable');
		return v === null ? false : v === 'true';
	});
	const [selectedSkills, setSelectedSkills] = useState([]);
	const [minRating, setMinRating] = useState(0);
	const [maxDistance, setMaxDistance] = useState(0);
	const [compactView, setCompactView] = useState(() => {
		const v = localStorage.getItem('repairers_compactView');
		return v === null ? true : v === 'true';
	});
	useEffect(() => {
		localStorage.setItem('repairers_compactView', compactView);
	}, [compactView]);
	const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
	const [page, setPage] = useState(1);
	const PAGE_SIZE = 10;
	// Liste unique des compétences
	const safeRepairers = useMemo(() => Array.isArray(repairers) ? repairers : [], [repairers]);
	const allSkills = useMemo(() => {
		const set = new Set();
		safeRepairers.forEach(r => {
			(Array.isArray(r.skills) ? r.skills : (r.skills ? String(r.skills).split(',') : [])).forEach(s => set.add(s.trim()));
		});
		return Array.from(set).filter(Boolean).sort();
	}, [safeRepairers]);
	const {
		filtered,
		paginated,
		favorites,
		toggleFavorite
	} = useRepairers(safeRepairers, {
		query,
		selectedSkills,
		minRating,
		maxDistance,
		showOnlyFavorites,
		nearbyOnly,
		onlyAvailable,
		page,
		pageSize: PAGE_SIZE
	});
	// Autocomplétion
	const autocomplete = useAutocomplete(query, safeRepairers, allSkills);
	const searchInputRef = useRef();
	// Responsive
	function useIsMobile() {
		const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
		useEffect(() => {
			const onResize = () => setIsMobile(window.innerWidth < 900);
			window.addEventListener('resize', onResize);
			return () => window.removeEventListener('resize', onResize);
		}, []);
		return isMobile;
	}
	const isMobile = useIsMobile();
	// Effets UI
	// Nettoyage des logs de dev
	// useEffect(() => {
	//     console.log(`[UI] filtersOpen=${filtersOpen}, isMobile=${isMobile}`);
	// }, [filtersOpen, isMobile]);
	// useEffect(() => {
	//     console.log('[UI] Rendu du panneau de filtres', document.querySelector('.filters-panel'));
	// }, [filtersOpen]);
	useEffect(() => {
		if (!filtersOpen) return;
		function handleClick(e) {
			// Ne pas fermer si clic sur le panneau ou sur le bouton d'ouverture principal (hors panneau)
			const isPanel = e.target.closest('.filters-drawer,.filters-modal');
			const isOpenBtn = e.target.closest('.filters-btn') && !isPanel;
			if (isPanel || isOpenBtn) return;
			setFiltersOpen(false);
		}
		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [filtersOpen]);
	// ...chargement des réparateurs (API) à réintégrer si besoin...
	// Log de debug avant le rendu principal
	// ...logs de debug supprimés...
	// Rendu principal
	return (
		<>
			{/* Header liste réparateurs + bouton Filtres */}
			<div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
				<h2 style={{fontSize:'1.35em',fontWeight:700,margin:'0 0 0 8px',color:'#222'}}>Réparateurs</h2>
				<button
					className="filters-btn"
					style={{
						background:'#0ea5e9',
						color:'#fff',
						border:'none',
						borderRadius:24,
						padding:'8px 18px',
						fontSize:'1.08em',
						fontWeight:600,
						boxShadow:'0 2px 8px rgba(0,0,0,0.10)',
						cursor:'pointer',
						display:'flex',
						alignItems:'center',
						gap:8,
						transition:'background 0.2s',
					}}
					aria-label="Ouvrir ou fermer les filtres"
					onClick={() => setFiltersOpen(v => !v)}
					onMouseOver={e=>e.currentTarget.style.background='#0284c7'}
					onMouseOut={e=>e.currentTarget.style.background='#0ea5e9'}
				>
					<span role="img" aria-label="Filtres" style={{fontSize:'1.25em'}}>⚙️</span>
					Filtres
				</button>
			</div>

			{/* Panneau de filtres premium dans le drawer/modal uniquement */}
			{filtersOpen && (
				<div className={isMobile ? "filters-modal" : "filters-drawer"}>
					<FiltersPanel
						query={query}
						setQuery={setQuery}
						searchInputRef={searchInputRef}
						autocomplete={autocomplete}
						setAutocomplete={() => {}}
						setPage={setPage}
						selectedSkills={selectedSkills}
						setSelectedSkills={setSelectedSkills}
						allSkills={allSkills}
						minRating={minRating}
						setMinRating={setMinRating}
						maxDistance={maxDistance}
						setMaxDistance={setMaxDistance}
						showOnlyFavorites={showOnlyFavorites}
						setShowOnlyFavorites={setShowOnlyFavorites}
						compactView={compactView}
						setCompactView={setCompactView}
						nearbyOnly={nearbyOnly}
						setNearbyOnly={setNearbyOnly}
						onlyAvailable={onlyAvailable}
						setOnlyAvailable={setOnlyAvailable}
						sortBy={sortBy}
						setSortBy={setSortBy}
						distanceAsc={distanceAsc}
						setDistanceAsc={setDistanceAsc}
						filtered={filtered}
						repairers={repairers}
						setFiltersOpen={setFiltersOpen}
					/>
				</div>
			)}
			{/* ...existing main content and grid... */}
			{error && <div className="error-banner">{error}</div>}
			{loading ? (
				<div className="repairers-grid">
					{Array.from({length:6}).map((_,i)=>( 
						<div className="skeleton-card" key={i} aria-hidden="true" />
					))}
				</div>
			) : (
				<div style={{display:'flex',gap:24,marginTop:18,flexWrap:'wrap'}}>
					<div style={{flex:'1 1 420px',minWidth:320}}>
						<div className="repairers-grid">
							{paginated.map((r, idx) => {
								const id = r.id || r.user_id;
								const isSelected = selected && (id === (selected.id || selected.user_id));
								return (
									<div
										key={id}
										className={`repairer-list-item${isSelected ? ' selected' : ''}`}
										tabIndex={0}
										aria-label={`Sélectionné : ${isSelected ? 'oui' : 'non'}`}
										style={{outline:isSelected?'2.5px solid #e53935':'none',borderRadius:10,transition:'outline 0.25s cubic-bezier(.4,2,.6,1)',position:'relative'}}
										onClick={() => setSelected(r)}
										onKeyDown={e => { if(e.key==='Enter'||e.key===' '){ setSelected(r); } }}
									>
										<RepairerCard
											repairer={r}
											onContact={async () => {
												try {
													setLoading(true);
													// On récupère l'utilisateur courant
													const clientId = user?.id;
													const repairerId = r.id || r.user_id;
													if (!clientId || !repairerId) throw new Error('Utilisateur ou réparateur manquant');
													// Création ou récupération de la conversation
													const { conversationService } = await import('../services/api');
													const res = await conversationService.createConversation(clientId, repairerId, null);
													const convId = res?.data?.conversation?.id || res?.data?.id;
													if (!convId) throw new Error('Conversation introuvable');
													navigate(`/dashboard?tab=messages&conversationId=${convId}`);
												} catch (err) {
													toastError('Impossible d’ouvrir la messagerie avec ce réparateur');
												} finally {
													setLoading(false);
												}
											}}
											nextSlot={null}
											isSelected={isSelected}
											showSkillsInline={compactView}
											onShowProfile={setSelectedProfile}
											index={idx}
											isFavorite={favorites.includes(id)}
											onToggleFavorite={toggleFavorite}
											compact={compactView}
										/>
									</div>
								);
							})}
						</div>
					</div>
					<div style={{flex:'1 1 420px',minWidth:320,maxWidth:'700px',height:'70vh',borderRadius:'12px',overflow:'hidden',boxShadow:'0 2px 8px rgba(0,0,0,0.07)'}}>
						<RepairersMap
							repairers={filtered}
							selectedRepairerId={selected ? (selected.id || selected.user_id) : null}
							onSelectRepairer={id => {
								const found = filtered.find(r => (r.id || r.user_id) === id);
								if (found) setSelected(found);
							}}
							onShowProfile={r => setSelectedProfile(r)}
						/>
					</div>
				</div>
			)}
			{/* Drawer latéral pour le détail */}
			{selectedProfile && (
				<Drawer onClose={() => setSelectedProfile(null)}>
					<RepairerProfileDetail repairer={selectedProfile} onBack={() => setSelectedProfile(null)} />
				</Drawer>
			)}
			{!loading && paginated.length < filtered.length && (
				<div style={{textAlign:'center',margin:'18px 0'}}>
					<button className="btn" onClick={() => setPage(page+1)} tabIndex={0} aria-label="Charger plus de réparateurs">Charger plus</button>
				</div>
			)}
			{/* Plus de modal contact, la redirection est directe */}
		</>
	);
}
import Drawer from '../components/Drawer';
import RepairerProfileDetail from '../components/RepairerProfileDetail';
import RepairerCard from '../components/RepairerCard';
import FiltersPanel from '../components/FiltersPanel';

// ...existing code...

export default Repairers;
// ...existing code...
