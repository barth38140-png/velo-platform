import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { repairerService, locationService, conversationService, repairService } from '../services/api';
import { RepairerCard } from '../components/RepairerCard';
import { ContactRepairerModal } from '../components/ContactRepairerModal';
import '../styles/repairers.css';

// Page de navigation et contact des réparateurs
// - Liste tous les réparateurs ou ceux à proximité si localisation disponible
// - Permet d'ouvrir une modal pour démarrer une conversation
export const Repairers = () => {
  const { profile } = useAuth();
  const { success, error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [repairers, setRepairers] = useState([]);
  const [nearbyOnly, setNearbyOnly] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating'); // rating|availability|name|distance
  const [distanceAsc, setDistanceAsc] = useState(true);
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const [myRepairs, setMyRepairs] = useState([]);

  // Filtrage local par nom/compétences
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = !q ? repairers : repairers.filter(r => {
      const skills = Array.isArray(r.skills) ? r.skills.join(' ') : (r.skills || '');
      return (
        (r.name || '').toLowerCase().includes(q) ||
        skills.toLowerCase().includes(q) ||
        (r.bio || '').toLowerCase().includes(q)
      );
    });

    if (onlyAvailable) {
      base = base.filter(r => r.is_available === true);
    }

    const sorted = [...base].sort((a, b) => {
      if (sortBy === 'rating') {
        const ra = a.rating ?? -Infinity;
        const rb = b.rating ?? -Infinity;
        return rb - ra; // desc
      }
      if (sortBy === 'availability') {
        const aa = (a.is_available === true) ? 1 : 0;
        const ab = (b.is_available === true) ? 1 : 0;
        if (ab !== aa) return ab - aa; // available first
        // fallback by rating
        const ra = a.rating ?? -Infinity;
        const rb = b.rating ?? -Infinity;
        return rb - ra;
      }
      if (sortBy === 'distance') {
        const da = a.distance_km ?? a.distanceKm ?? Infinity;
        const db = b.distance_km ?? b.distanceKm ?? Infinity;
        return distanceAsc ? (da - db) : (db - da);
      }
      // name
      const na = (a.name || '').toLowerCase();
      const nb = (b.name || '').toLowerCase();
      return na.localeCompare(nb);
    });
    return sorted;
  }, [query, repairers, sortBy, distanceAsc]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        // On tente d'abord les réparateurs à proximité si l'utilisateur a une localisation
        // Sinon, on récupère la liste complète
        if (nearbyOnly && profile?.location) {
          const { latitude, longitude } = profile.location;
          const res = await locationService.getNearbyRepairers(latitude, longitude, 20);
          if (!isMounted) return;
          const list = Array.isArray(res.data?.repairers) ? res.data.repairers : res.data || [];
          setRepairers(list);
        } else {
          const res = await repairerService.getAllRepairers();
          if (!isMounted) return;
          const list = Array.isArray(res.data?.repairers) ? res.data.repairers : res.data || [];
          setRepairers(list);
        }
        // Charger les demandes du client pour permettre la sélection lors du contact
        try {
          const mine = await repairService.getMyRepairs();
          const repairs = Array.isArray(mine.data?.repairs) ? mine.data.repairs : (mine.data || mine) || [];
          if (isMounted) setMyRepairs(repairs);
        } catch (_) { /* silencieux si indisponible */ }
      } catch (e) {
        // Message d'erreur pour l'UI (français), logs backend en anglais via pino côté serveur
        if (isMounted) setError("Impossible de charger les réparateurs. Réessayez plus tard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [nearbyOnly, profile]);

  const onContact = (repairer) => {
    setSelected(repairer);
  };

  const onCloseModal = () => setSelected(null);

  const onStartConversation = async (message, repairRequestId) => {
    if (!selected) return;
    try {
      // Démarrage d'une conversation structurée avec le réparateur
      if (!repairRequestId) {
        setError("Veuillez sélectionner une demande à associer à la conversation.");
        return;
      }
      const conv = await conversationService.createConversation(selected.id, repairRequestId);
      const convId = conv?.data?.id || conv?.data?.conversationId;
      if (convId && message?.trim()) {
        await conversationService.sendMessage(convId, message.trim());
      }
      setSelected(null);
      success('Conversation démarrée avec succès.');
    } catch (e) {
      setError("Échec du démarrage de la conversation. Réessayez.");
      toastError('Failed to start conversation');
    }
  };

  return (
    <div className="repairers-page">
      <div className="repairers-header">
        <h1>Réparateurs disponibles</h1>
        <div className="repairers-controls">
          <input
            type="text"
            placeholder="Rechercher par nom, compétence, bio…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <label>
            Tri
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="rating">Note ↓</option>
              <option value="availability">Disponibilité</option>
              {nearbyOnly && <option value="distance">Distance</option>}
              <option value="name">Nom A→Z</option>
            </select>
          </label>
          {nearbyOnly && sortBy === 'distance' && (
            <label className="toggle">
              <input type="checkbox" checked={distanceAsc} onChange={(e) => setDistanceAsc(e.target.checked)} />
              <span>Distance ↑</span>
            </label>
          )}
          <label className="toggle">
            <input
              type="checkbox"
              checked={nearbyOnly}
              onChange={(e) => setNearbyOnly(e.target.checked)}
            />
            <span>À proximité uniquement</span>
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={(e) => setOnlyAvailable(e.target.checked)}
            />
            <span>Uniquement disponibles</span>
          </label>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading ? (
        <div className="loader">Chargement…</div>
      ) : (
        <div className="repairers-grid">
          {filtered.map((r) => (
            <RepairerCard key={r.id || r.user_id} repairer={r} onContact={onContact} />
          ))}
          {!filtered.length && (
            <div className="empty">Aucun réparateur trouvé.</div>
          )}
        </div>
      )}

      {selected && (
        <ContactRepairerModal
          repairer={selected}
          onClose={onCloseModal}
          onSubmit={onStartConversation}
          repairs={myRepairs}
        />
      )}
    </div>
  );
};

export default Repairers;
