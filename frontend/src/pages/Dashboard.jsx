
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { repairService, repairPhotoService } from '../services/api';
import { socket } from '../services/socket';
import NotificationCenter from '../components/NotificationCenter';
import { ExploreRepairs } from './ExploreRepairs';
import { MyOffers } from './MyOffers';
import { OffersReceived } from './OffersReceived';
import { Profile } from './Profile';
import MapPicker from '../components/MapPicker';
import '../styles/Dashboard.css';
import '../styles/RepairForm.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user?.role === 'repairer' ? 'explore' : 'repairs');
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [realtimeMsg, setRealtimeMsg] = useState('');
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [formData, setFormData] = useState({ title: '', description: '', bikeType: '', wheelSize: '', problem: '', affectedParts: '', severity: 'minor', photos: [], location: '', locationLat: null, locationLng: null, locationAddress: '' });
  
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const photosInputRef = useRef(null);
  const [mapResetCounter, setMapResetCounter] = useState(0);
  const toastTimeout = useRef();

  const generateTitle = (f = formData) => {
    try {
      const problem = (f.problem || '').trim();
      const type = (f.bikeType || '').trim();
      const shortProblem = problem || 'réparation';
      let title = `Réparation ${shortProblem}`;
      if (type) title += ` — ${type}`;
      if (f.locationAddress) {
        const shortAddr = String(f.locationAddress).split(',')[0];
        if (shortAddr) title += ` à ${shortAddr}`;
      }
      return title;
    } catch (e) {
      return 'Réparation';
    }
  };

  useEffect(() => {
    if (!user) return;
    socket.auth = { token: localStorage.getItem('token') };
    socket.connect();
    socket.emit('join-chat', user.id);

    socket.on('new_offer', (data) => {
      setNotifications(n => [{ id: Date.now(), text: '📩 Nouvelle offre reçue sur une de vos demandes !', ts: Date.now() }, ...n]);
    });

    socket.on('status_update', async (data) => {
      setNotifications(n => [{ id: Date.now(), text: `🔔 Statut mis à jour : ${data.status}`, ts: Date.now() }, ...n]);
      try {
        const r = await repairService.getMyRepairs();
        setRepairs(r.data.repairs || []);
      } catch (e) {}
    });

    socket.on('new_message', (data) => {
      setNotifications(n => [{ id: Date.now(), text: '💬 Nouveau message reçu !', ts: Date.now() }, ...n]);
    });

    return () => {
      socket.off('new_offer');
      socket.off('status_update');
      socket.off('new_message');
      socket.disconnect();
    };
  }, [user]);

  const useMyLocation = () => {
    if (!navigator.geolocation) { setError('Géolocalisation non supportée'); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const addr = data.display_name || '';
        setFormData(f => ({ ...f, locationLat: lat, locationLng: lng, locationAddress: addr }));
      } catch (e) {
        setError('Impossible de récupérer l\'adresse');
      } finally {
        setLoading(false);
      }
    }, (err) => { setLoading(false); setError('Autorisation géolocalisation refusée'); });
  };
          <button
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span>👤 Profil</span>
          </button>
        </nav>

        <main className="dashboard-main">

          {error && <div className="error-toast">{error}</div>}
          {success && <div className="success-toast">{success}</div>}
          <div className="repair-form-shell">
            <h2 className="repair-title">Déclarez votre problème en quelques clics</h2>
            <p className="repair-sub">Votre demande sera transmise à nos réparateurs partenaires.</p>

            <div className="steps-indicator">
              <button className={`step ${step===1? 'active':''}`}>1<br/><small>Type</small></button>
              <div className="step-sep" />
              <button className={`step ${step===2? 'active':''}`}>2<br/><small>Problème</small></button>
              <div className="step-sep" />
              <button className={`step ${step===3? 'active':''}`}>3<br/><small>Localisation</small></button>
            </div>

            <form onSubmit={handleCreateRepair} className="modern-form">
              {step === 1 && (
                <div className="step-panel">
                  <label className="label">1 — Type de vélo</label>
                  <div style={{display:'flex', gap:12}}>
                    <select data-cy="repair-bike-type" value={formData.bikeType} onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })} required style={{flex:1, padding:10, borderRadius:8}}>
                      <option value="">Sélectionner le type</option>
                      <option value="VTC">VTC</option>
                      <option value="VTT">VTT</option>
                      <option value="Ville">Ville</option>
                      <option value="Electrique">Électrique</option>
                      <option value="Cargo">Cargo</option>
                    </select>
                    <select data-cy="repair-wheel-size" value={formData.wheelSize} onChange={(e) => setFormData({ ...formData, wheelSize: e.target.value })} style={{width:160, padding:10, borderRadius:8}}>
                      <option value="">Taille roue</option>
                      <option value="26">26"</option>
                      <option value="27.5">27.5"</option>
                      <option value="28">28"</option>
                      <option value="29">29"</option>
                    </select>
                  </div>
                  <div className="form-actions">
                    <button type="button" className="btn secondary" onClick={prevStep}>Annuler</button>
                    <button type="button" className="btn primary" onClick={nextStep} disabled={!formData.bikeType}>Suivant</button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-panel">
                  <label className="label">2 — Problème principal</label>
                  <div className="issue-icons" style={{marginBottom:12}}>
                    <button type="button" className={`issue-btn ${formData.problem==='pneu'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'pneu' }))}>🔧 Pneu</button>
                    <button type="button" className={`issue-btn ${formData.problem==='freins'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'freins' }))}>🛠️ Freins</button>
                    <button type="button" className={`issue-btn ${formData.problem==='chaine'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'chaine' }))}>🔗 Chaîne</button>
                    <button type="button" className={`issue-btn ${formData.problem==='autre'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'autre' }))}>⚙️ Autre</button>
                  </div>

                  <label className="label">Description (facultatif)</label>
                  <textarea
                    data-cy="repair-description"
                    placeholder="Quelques détails — optionnel"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <div className="suggestions" style={{marginTop:8}}>
                    <small>Suggestions: </small>
                    <button type="button" className="suggest-btn" onClick={() => setFormData(f => ({ ...f, description: 'Pneu crevé' }))}>pneu crevé</button>
                    <button type="button" className="suggest-btn" onClick={() => setFormData(f => ({ ...f, description: 'Frein qui grince' }))}>frein qui grince</button>
                    <button type="button" className="suggest-btn" onClick={() => setFormData(f => ({ ...f, description: 'Chaîne cassée' }))}>chaîne cassée</button>
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn secondary" onClick={prevStep}>Précédent</button>
                    <button type="button" className="btn primary" onClick={nextStep} disabled={!formData.problem}>Suivant</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="step-panel">
                  <label className="label">3 — Localisation</label>
                  <div className="location-row">
                    <MapPicker showConfirm={false} showAddress={true} showSearch={false} showCoords={false} resetTrigger={mapResetCounter} initialPosition={{ lat: 48.8566, lng: 2.3522 }} onChange={(pos) => setFormData(f => ({ ...f, locationLat: pos.lat, locationLng: pos.lng, locationAddress: pos.address }))} />
                  </div>
                  <input
                    type="text"
                    data-cy="repair-location"
                    placeholder="Adresse (optionnel)"
                    value={formData.locationAddress || formData.location}
                    onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  />
                  <div className="location-actions">
                    <button type="button" className="btn tertiary" onClick={useMyLocation}>Utiliser ma position</button>
                    <small className="micro">Nous utilisons OpenStreetMap pour localiser votre position.</small>
                  </div>

                  <div style={{marginTop:12}}>
                    <label className="label">Photos (optionnel)</label>
                    <input ref={photosInputRef} data-cy="repair-photos" type="file" accept="image/*" capture="environment" onChange={(e) => handlePhotosSelected(e.target.files)} />
                  </div>

                  <div style={{display:'flex', justifyContent:'center', marginTop:18}}>
                    <button data-cy="repair-submit" type="submit" className="btn primary" style={{padding:'12px 20px', fontSize:16}} disabled={loading}>{loading ? 'Création...' : 'Envoyer ma demande'}</button>
                  </div>
                </div>
              )}

            </form>
          </div>
          {realtimeMsg && <div className="success-toast">{realtimeMsg}</div>}

          {activeTab === 'repairs' && (
            <div className="tab-content">
              <h2>Mes demandes de réparation</h2>
              {loading ? (
                <div className="spinner"><div className="loader"></div> Chargement...</div>
              ) : repairs.length > 0 ? (
                <div className="repairs-list">
                  {repairs.map(repair => (
                    <div key={repair.id} className="repair-card">
                      <div className="repair-card-header">
                        <h3>{repair.title}</h3>
                        <span className={`status-badge status-${repair.status?.toLowerCase()}`}>{repair.status}</span>
                      </div>
                      <p>{repair.description}</p>
                      <div className="repair-meta">
                        <span className="meta-type">🚲 {repair.bike_type}</span>
                        <span className="meta-location">📍 {repair.location_address || repair.location || 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-list">Aucune demande pour l’instant</p>
              )}
            </div>
          )}

          {activeTab === 'create' && (
            <div className="tab-content">
              <h2>Nouvelle demande de réparation</h2>
              <p>Utilisez le formulaire simplifié en haut de la page pour créer votre demande en 3 étapes rapides.</p>
              <button className="btn primary" onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Commencer une demande</button>
            </div>
          )}

          {activeTab === 'offers' && (
            <div className="tab-content">
              <OffersReceived />
            </div>
          )}

          {activeTab === 'explore' && (
            <div className="tab-content">
              <ExploreRepairs />
            </div>
          )}

          {activeTab === 'my-offers' && (
            <div className="tab-content">
              <MyOffers />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="tab-content">
              <Profile />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
