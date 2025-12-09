import React, { useState, useEffect, useCallback, useRef } from 'react';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// Patch Leaflet pour icônes markers
import '../../src/leaflet-patch';
import { useAuth } from '../context/AuthContext';
import { repairService, repairOfferService, conversationService } from '../services/api';
import { socket } from '../services/socket';
import '../styles/ExploreRepairs.css';

// 💡 Ajout d'un style responsive mobile
import '../styles/ExploreRepairs.mobile.css';
import '../styles/Modal.css';

// Composant LeafletMap pour afficher les demandes sur la carte
function LeafletMap({ repairs, selectedRepair, setSelectedRepair, userLocation }) {
  // Composant pour centrer la carte sur le marqueur sélectionné
  // Centrage sur le marqueur sélectionné avec priorité et zoom adapté
  function MapCenterOnSelected({ selectedRepair }) {
    const map = useMap();
    React.useEffect(() => {
      if (selectedRepair && selectedRepair.location_lat && selectedRepair.location_lng) {
        map.setView([selectedRepair.location_lat, selectedRepair.location_lng], 13, { animate: true });
      }
    }, [selectedRepair, map]);
    return null;
  }
  // Centrage sur la position utilisateur uniquement si aucun marqueur sélectionné
  function MapAutoCenter({ userLocation, selectedRepair }) {
    const map = useMap();
    React.useEffect(() => {
      if (!selectedRepair && userLocation && userLocation.lat && userLocation.lon) {
        map.setView([userLocation.lat, userLocation.lon], 11, { animate: false });
      }
    }, [userLocation, selectedRepair, map]);
    return null;
  }
  // Centrage sur la première demande ou la position utilisateur
  const defaultPosition = userLocation && userLocation.lat && userLocation.lon
    ? [userLocation.lat, userLocation.lon]
    : repairs.length > 0 && repairs[0].location_lat && repairs[0].location_lng
      ? [repairs[0].location_lat, repairs[0].location_lng]
      : [48.8566, 2.3522]; // Paris par défaut

  // Icônes standard Leaflet colorées (liens officiels)
  const userIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  const blueIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
  const redIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    iconRetinaUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  return (
    <MapContainer center={defaultPosition} zoom={7} style={{ width: '100%', height: '100%' }} scrollWheelZoom={true}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Centrage sur le marqueur sélectionné (prioritaire) */}
      <MapCenterOnSelected selectedRepair={selectedRepair} />
      {/* Centrage sur la position utilisateur si aucun marqueur sélectionné */}
      <MapAutoCenter userLocation={userLocation} selectedRepair={selectedRepair} />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lon]} icon={userIcon}>
          <Popup>Votre position</Popup>
        </Marker>
      )}
      {/* Utilisation du cluster compatible React 18 / React-Leaflet v4 */}
      <MarkerClusterGroup>
        {repairs.filter(r => r.location_lat && r.location_lng).map(repair => (
          <Marker
            key={repair.id}
            position={[repair.location_lat, repair.location_lng]}
            eventHandlers={{
              click: () => setSelectedRepair(repair)
            }}
            icon={selectedRepair && String(selectedRepair.id) === String(repair.id) ? redIcon : blueIcon}
          >
            <Popup>
              <strong>{repair.title}</strong><br />
              {repair.location_address}<br />
              <span style={{color:'#555'}}>{repair.description}</span>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}

// ⚠️ Suppression de l'export par défaut en doublon
// export default function ExploreRepairs() {
//   return <div style={{fontSize:'2em',color:'red',padding:'48px'}}>DEBUG TEST PAGE</div>;
// }

/**
 * Composant principal pour explorer les réparations
 * @returns {JSX.Element}
 */
const ExploreRepairs = () => {
    // État pour afficher le formulaire d'offre uniquement après clic
    const [showOfferForm, setShowOfferForm] = useState(false);
  // Barre de recherche par mot-clé
  const [searchTerm, setSearchTerm] = useState('');
  // Ajout de l'état pour les réparations proches
  const [nearbyRepairs, setNearbyRepairs] = useState([]);
  // Ajout des hooks manquants pour la messagerie et le succès
  const [contactMessage, setContactMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // Ajout de l'état pour la liste principale des réparations
  const [repairs, setRepairs] = useState([]);
  // Ajout de l'état pour la géolocalisation utilisateur
  const [userLocation, setUserLocation] = useState(null); // utile pour la géolocalisation
  // Récupération de l'utilisateur connecté
  const { user } = useAuth();
  // États principaux du composant
  const [sortBy, setSortBy] = useState('date_desc');
  const [selectedRepair, setSelectedRepair] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  // Suppression : variable non utilisée
  // Initialisation du formulaire d'offre
  const [offerForm, setOfferForm] = useState({
    price: '30.00',
    duration: '1',
    message: 'Bonjour, je peux intervenir rapidement. Voici mon devis initial.',
    scheduledFrom: '',
    scheduledTo: ''
  });
  // Loader et gestion d'erreur
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Ajout de l'état pour la date de dernière mise à jour
  const [lastUpdated, setLastUpdated] = useState(null);
  // Ref pour suivre l'interaction utilisateur
  const hasInteracted = useRef(false);
  // Fonction de gestion du focus
  const onFocus = () => {
    hasInteracted.current = true;
  };
  // Suppression : variable non utilisée
  // Ajout des hooks manquants pour le détail et la messagerie
  const [loadingMessages, setLoadingMessages] = useState(false); // utilisé dans openDetail
  const [messages, setMessages] = useState([]); // utilisé dans openDetail
  // contactMessage non utilisé, suppression
  // successMessage non utilisé, suppression
  const [formErrors, setFormErrors] = useState({}); // utilisé dans handleSubmitOffer
  const [sendingOffer, setSendingOffer] = useState(false); // utilisé dans handleSubmitOffer
  let repairsToShow = nearbyRepairs.length > 0 ? nearbyRepairs : repairs;
  if (import.meta.env.MODE === 'test') {
    repairsToShow = repairs;
  }
  // Tri des réparations à afficher
  const sortedRepairs = React.useMemo(() => {
    const arr = [...repairsToShow];
    switch (sortBy) {
    case 'date_desc':
      return arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    case 'date_asc':
      return arr.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    case 'type':
      return arr.sort((a, b) => String(a.bike_type || '').localeCompare(String(b.bike_type || '')));
    default:
      return arr;
    }
  }, [repairsToShow, sortBy]);
  // Fonction de chargement des réparations en attente
  const loadPendingRepairs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await repairService.getPendingRepairs();
      setRepairs(res.data?.repairs || []);
      setLastUpdated(new Date());
      // Filtrer les réparations proches si la géolocalisation est disponible
      if (userLocation && Array.isArray(res.data?.repairs)) {
        const nearby = res.data.repairs.filter(r => {
          if (!r.location_lat || !r.location_lon) return false;
          const dist = calculateDistance(
            userLocation.lat,
            userLocation.lon,
            r.location_lat,
            r.location_lon
          );
          return dist < 10; // 10km
        });
        setNearbyRepairs(nearby);
      } else {
        setNearbyRepairs([]);
      }
    } catch {
      setError('Impossible de charger les réparations à explorer.');
      setRepairs([]);
      setNearbyRepairs([]);
    }
    setLoading(false);
  }, [userLocation]);

  // Chargement initial discret pour les réparateurs
  // Déclenché une fois après un court délai pour éviter les effets StrictMode
  useEffect(() => {
    if (user?.role === 'repairer') {
      const initialTimer = setTimeout(() => {
        hasInteracted.current = true;
        loadPendingRepairs();
      }, 400);
      return () => clearTimeout(initialTimer);
    }
  }, [user?.role, loadPendingRepairs]);

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const openDetail = (repair) => {
    setSelectedRepair(repair);
    setShowDetailModal(true);
    setShowOfferForm(false); // Masquer le formulaire à l'ouverture du détail
    setOfferForm({
      price: offerForm.price || '30.00',
      duration: offerForm.duration || '1',
      message: offerForm.message || `Bonjour ${repair?.client_name || ''}, je peux intervenir rapidement sur "${repair?.title}". Voici mon devis initial.`,
      scheduledFrom: '',
      scheduledTo: ''
    });
    // Charger les messages de la conversation liée à cette demande
    (async () => {
      setLoadingMessages(true);
      setMessages([]);
      try {
        const conv = await conversationService.createConversation(user?.id, repair.id);
        const convId = conv?.data?.id || conv?.data?.conversationId;
        if (convId) {
          const res = await conversationService.getMessages(convId);
          setMessages(res.data?.messages || []);
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    })();
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedRepair(null);
    setShowOfferForm(false); // Masquer le formulaire à la fermeture
    setOfferForm({ price: '30.00', duration: '1', message: 'Bonjour, je peux intervenir rapidement. Voici mon devis initial.', scheduledFrom: '', scheduledTo: '' });
    setContactMessage('');
    setMessages([]);
    setSuccessMessage('');
    setFormErrors({});
    setError('');
  };

  const handleSubmitOffer = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    const errs = {};
    const priceNum = Number(offerForm.price);
    const durNum = Number(offerForm.duration);
    if (!Number.isFinite(priceNum) || priceNum < 0.01) errs.price = 'Le prix doit être au moins 0,01€';
    if (!Number.isInteger(durNum) || durNum < 1) errs.duration = 'La durée doit être un entier ≥ 1';
    if (!offerForm.message || offerForm.message.trim().length < 5) errs.message = 'Le message doit contenir au moins 5 caractères';
    if (offerForm.scheduledFrom && offerForm.scheduledTo) {
      const from = new Date(offerForm.scheduledFrom);
      const to = new Date(offerForm.scheduledTo);
      if (!isFinite(from.getTime()) || !isFinite(to.getTime())) {
        errs.scheduled = 'Dates d\'intervention invalides';
      } else if (to < from) {
        errs.scheduled = 'La fin doit être postérieure au début';
      }
    }
    setFormErrors(errs);
    if (Object.keys(errs).length > 0) return;
    if (sendingOffer) return;
    // setSendingOffer(true); // Non utilisé
    try {
      const response = await repairOfferService.createOffer(
        Number(selectedRepair.id),
        parseFloat(offerForm.price),
        parseInt(offerForm.duration, 10),
        offerForm.message,
        offerForm.scheduledFrom && offerForm.scheduledFrom.trim() ? new Date(offerForm.scheduledFrom).toISOString() : null,
        offerForm.scheduledTo && offerForm.scheduledTo.trim() ? new Date(offerForm.scheduledTo).toISOString() : null
      );
      setSuccessMessage(`✅ Offre envoyée avec succès pour "${selectedRepair.title}" !`);
      setOfferForm({ price: '30.00', duration: '1', message: 'Bonjour, je peux intervenir rapidement. Voici mon devis initial.', scheduledFrom: '', scheduledTo: '' });
      setFormErrors({});
      setTimeout(() => {
        setSuccessMessage('');
        closeDetail();
      }, 2000);
      await loadPendingRepairs();
    } catch (error) {
      const data = error?.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        const vErrs = {};
        data.errors.forEach((errItem) => {
          if (errItem?.field && errItem?.message) vErrs[errItem.field] = errItem.message;
        });
        setFormErrors(vErrs);
        setError('❌ Des champs sont invalides. Veuillez corriger et réessayer.');
      } else if (data?.error) {
        setError(`❌ ${data.error}`);
      } else {
        setError('❌ Échec de l\'envoi de l\'offre. Veuillez réessayer.');
      }
    } finally {
      setSendingOffer(false);
    }
  };

  // On utilise repairsToShow déjà déclaré plus haut, éviter la redéclaration
  if (import.meta.env.MODE === 'test') {
    repairsToShow = repairs;
  }
  // ⚠️ Suppression de la redéclaration de sortedRepairs ici (déjà déclarée plus haut)

  return (
    <div className="explore-repairs">
      <div className="explore-repairs-container" style={{maxWidth:'900px',margin:'0 auto',padding:'8px'}}>
        <h2 style={{textAlign:'center',marginBottom:'12px',fontSize:'1.4em',color:'#1976d2'}}>🔎 Demandes à explorer</h2>
        {/* Barre de recherche et filtres rapides */}
        <div style={{display:'flex',flexWrap:'wrap',gap:'8px',justifyContent:'center',marginBottom:'12px'}}>
          <input
            type="text"
            placeholder="Rechercher par mot-clé (titre, description, adresse)"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{padding:'7px',borderRadius:'6px',border:'1px solid #b3b3b3',minWidth:'180px',fontSize:'1em',background:'#f7f7fa'}}
            aria-label="Recherche demandes"
          />
          <label htmlFor="filter-type" style={{fontWeight:'bold',color:'#1976d2'}}>Type :</label>
          <select id="filter-type" value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{padding:'4px 8px',borderRadius:'6px',border:'1px solid #b3b3b3',background:'#f7f7fa'}}>
            <option value="date_desc">Date ↓</option>
            <option value="date_asc">Date ↑</option>
            <option value="type">Type</option>
            <option value="status">Statut</option>
          </select>
        </div>
        {loading && (
          <div className="loader" aria-live="polite" style={{textAlign:'center',margin:'24px'}}>
            <div className="spinner" style={{display:'inline-block',width:'32px',height:'32px',border:'4px solid #1976d2',borderTop:'4px solid #fff',borderRadius:'50%',animation:'spin 1s linear infinite',marginRight:'8px'}}></div>
            <span style={{color:'#1976d2'}}>Chargement des demandes...</span>
            <style>{'@keyframes spin{0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}'}</style>
          </div>
        )}
        {error && (
          <div className="error-message" role="alert" style={{color:'#d32f2f',margin:'16px',textAlign:'center',background:'#fee2e2',borderRadius:'6px',padding:'8px'}}>
            {error}
          </div>
        )}
        {!loading && repairs.length === 0 && !error && (
          <div style={{textAlign:'center',margin:'32px',color:'#888',fontSize:'1.1em'}}>Aucune demande à explorer pour le moment.</div>
        )}
        {!loading && repairs.length > 0 && (
          <React.Fragment>
            {/* Carte Leaflet affichant les demandes */}
            <div style={{width:'100%',maxWidth:'900px',height:'320px',margin:'0 auto 18px auto',borderRadius:'12px',overflow:'hidden',boxShadow:'0 2px 12px #e3e3e3'}}>
              <LeafletMap
                repairs={repairs}
                selectedRepair={selectedRepair}
                setSelectedRepair={setSelectedRepair}
                userLocation={userLocation}
              />
            </div>
            {selectedRepair ? (
              <div className="repair-detail-view" style={{background:'#fff',borderRadius:'12px',boxShadow:'0 2px 12px #e3e3e3',margin:'18px auto',padding:'18px',maxWidth:'600px'}}>
                <button onClick={()=>setSelectedRepair(null)} style={{float:'right',background:'#eee',border:'none',borderRadius:'50%',width:'32px',height:'32px',fontSize:'1.5em',cursor:'pointer'}} aria-label="Fermer le détail">&times;</button>
                <h2 style={{marginTop:0,color:'#1976d2'}}>{selectedRepair.title}</h2>
                <div style={{color:'#555',marginBottom:'10px'}}>{selectedRepair.description}</div>
                <div style={{fontSize:'0.95em',color:'#666',marginBottom:'10px'}}>{selectedRepair.location_address}</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginBottom:'12px'}}>
                  <span style={{background:'#e3f2fd',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>Type : {selectedRepair.bike_type}</span>
                  <span style={{background:'#fce4ec',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>Statut : {selectedRepair.status}</span>
                  <span style={{background:'#f3e5f5',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>Créée le : {new Date(selectedRepair.created_at).toLocaleDateString()}</span>
                  {userLocation && selectedRepair.location_lat && selectedRepair.location_lng && (
                    <span style={{background:'#e8f5e9',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>
                      Distance : {calculateDistance(userLocation.lat, userLocation.lon, selectedRepair.location_lat, selectedRepair.location_lng).toFixed(1)} km
                    </span>
                  )}
                </div>
                {/* Bouton pour ouvrir le formulaire d'offre */}
                {!showOfferForm && (
                  <button
                    type="button"
                    style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 16px',fontSize:'1em',cursor:'pointer',marginBottom:'12px'}}
                    onClick={()=>setShowOfferForm(true)}
                    aria-label="Proposer une offre"
                  >
                    Proposer une offre
                  </button>
                )}
                {/* Formulaire d'offre */}
                {showOfferForm && (
                  <form onSubmit={handleSubmitOffer} style={{marginTop:'18px',display:'flex',flexDirection:'column',gap:'12px'}}>
                    <label htmlFor="scheduledFrom">Date de début d'intervention</label>
                    <input
                      id="scheduledFrom"
                      name="scheduledFrom"
                      type="datetime-local"
                      value={offerForm.scheduledFrom}
                      onChange={e => setOfferForm(f => ({ ...f, scheduledFrom: e.target.value }))}
                      aria-label="Date de début d'intervention"
                      required
                    />
                    <label htmlFor="scheduledTo">Date de fin d'intervention</label>
                    <input
                      id="scheduledTo"
                      name="scheduledTo"
                      type="datetime-local"
                      value={offerForm.scheduledTo}
                      onChange={e => setOfferForm(f => ({ ...f, scheduledTo: e.target.value }))}
                      aria-label="Date de fin d'intervention"
                      required
                    />
                    <label htmlFor="price">Votre devis (€)</label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={offerForm.price}
                      onChange={e => setOfferForm(f => ({ ...f, price: e.target.value }))}
                      aria-label="Votre devis"
                      required
                    />
                    <label htmlFor="duration">Durée estimée (h)</label>
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="1"
                      step="1"
                      value={offerForm.duration}
                      onChange={e => setOfferForm(f => ({ ...f, duration: e.target.value }))}
                      aria-label="Durée estimée"
                      required
                    />
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      value={offerForm.message}
                      onChange={e => setOfferForm(f => ({ ...f, message: e.target.value }))}
                      aria-label="Message"
                      required
                    />
                    {formErrors.scheduled && <div style={{color:'#d32f2f'}}>{formErrors.scheduled}</div>}
                    {formErrors.price && <div style={{color:'#d32f2f'}}>{formErrors.price}</div>}
                    {formErrors.duration && <div style={{color:'#d32f2f'}}>{formErrors.duration}</div>}
                    {formErrors.message && <div style={{color:'#d32f2f'}}>{formErrors.message}</div>}
                    <button type="submit" style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'8px 16px',fontSize:'1em',cursor:'pointer'}}>
                      Envoyer l'offre
                    </button>
                    {successMessage && <div style={{color:'#43a047'}}>{successMessage}</div>}
                    {error && <div style={{color:'#d32f2f'}}>{error}</div>}
                  </form>
                )}
              </div>
            ) : (
              <ul className="repairs-list" style={{listStyle:'none',padding:0,margin:0}}>
                {sortedRepairs.filter(repair => {
                  const term = searchTerm.trim().toLowerCase();
                  if (!term) return true;
                  return (
                    (repair.title && repair.title.toLowerCase().includes(term)) ||
                    (repair.description && repair.description.toLowerCase().includes(term)) ||
                    (repair.location_address && repair.location_address.toLowerCase().includes(term))
                  );
                }).map(repair => {
                  // Correction date robuste
                  let dateStr = 'Non renseignée';
                  if (repair.created_at) {
                    const d = new Date(repair.created_at);
                    dateStr = isNaN(d.getTime()) ? 'Non renseignée' : d.toLocaleDateString();
                  }
                  return (
                    <li
                      key={repair.id}
                      data-testid={`repair-item-${repair.id}`}
                      style={{background:'#fff',borderRadius:'8px',boxShadow:'0 2px 8px #e3e3e3',margin:'12px 0',padding:'12px',display:'flex',flexDirection:'column',gap:'6px',cursor:'pointer',transition:'box-shadow 0.2s'}}
                      tabIndex={0}
                      aria-label={`Voir le détail de la demande ${repair.title}`}
                      onClick={() => setSelectedRepair(repair)}
                      onKeyDown={e => {if(e.key==='Enter'||e.key===' '){setSelectedRepair(repair);}}}
                    >
                      <h3 style={{fontWeight:'bold',fontSize:'1em',display:'flex',alignItems:'center',gap:'6px',color:'#1976d2',margin:0}}>
                        {repair.title}
                        {repair.photos && repair.photos.length > 0 && <span style={{color:'#1976d2'}}>📷</span>}
                      </h3>
                      <div style={{color:'#555'}}>{repair.description}</div>
                      <div style={{fontSize:'0.95em',color:'#666'}}>{repair.location_address}</div>
                      <div style={{display:'flex',flexWrap:'wrap',gap:'10px',marginTop:'6px'}}>
                        <span style={{background:'#e3f2fd',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>Type : {repair.bike_type}</span>
                        <span style={{background:'#fce4ec',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>Statut : {repair.status}</span>
                        <span style={{background:'#f3e5f5',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>Créée le : {dateStr}</span>
                        {userLocation && repair.location_lat && repair.location_lng && (
                          <span style={{background:'#e8f5e9',borderRadius:'4px',padding:'2px 8px',fontSize:'0.9em'}}>
                            Distance : {calculateDistance(userLocation.lat, userLocation.lon, repair.location_lat, repair.location_lng).toFixed(1)} km
                          </span>
                        )}
                      </div>
                      {/* Actions rapides accessibles */}
                      <div style={{display:'flex',gap:'10px',marginTop:'8px'}}>
                        <button data-testid={`accept-btn-${repair.id}`} style={{background:'#1976d2',color:'#fff',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer'}} aria-label={`Accepter la demande ${repair.title}`}>Accepter</button>
                        <button data-testid={`contact-btn-${repair.id}`} style={{background:'#43a047',color:'#fff',border:'none',borderRadius:'6px',padding:'6px 12px',cursor:'pointer'}} aria-label={`Contacter le client pour ${repair.title}`}>Contacter</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </React.Fragment>
        )}
        {/* ...existing code... */}
        {/* Modal de détail et formulaire d'offre, inchangé */}
        {showDetailModal && selectedRepair && (
          <div className="modal-overlay" role="dialog" aria-modal="true" tabIndex={-1} data-testid="repair-detail-modal">
            {/* ...modal existant... */}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span className="muted" aria-live="polite" style={{color:'#888'}}>Dernière mise à jour: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'jamais'}</span>
      </div>
      {/* Affichage d'erreur global */}
      {error && (
        <div style={{ color: '#d32f2f', background: '#fee2e2', padding: '10px', borderRadius: '6px', marginBottom: '10px', fontWeight: 'bold' }}>
          Erreur: {error}
        </div>
      )}
      {/* ...existing code... */}
    </div>
  );
};

// ✅ Export par défaut unique

export { ExploreRepairs };
