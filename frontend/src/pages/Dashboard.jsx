
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
  const [formData, setFormData] = useState({ title: '', description: '', bikeType: '', wheelSize: '', affectedParts: '', severity: 'minor', photos: [], location: '', locationLat: null, locationLng: null, locationAddress: '' });
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const photosInputRef = useRef(null);
  const [mapResetCounter, setMapResetCounter] = useState(0);
  const toastTimeout = useRef();

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handlePhotosSelected = (files) => {
    const arr = Array.from(files || []);
    const previews = arr.map(f => ({ name: f.name, url: URL.createObjectURL(f), fileSize: f.size, file: f }));
    try { photoPreviews.forEach(p => URL.revokeObjectURL(p.url)); } catch (e) {}
    setPhotoPreviews(previews);
    setFormData(prev => ({ ...prev, photos: arr }));
  };

  const handleCreateRepair = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await repairService.createRepair(
        formData.title,
        formData.description,
        formData.bikeType,
        formData.locationLat,
        formData.locationLng,
        formData.locationAddress,
        { wheelSize: formData.wheelSize, affectedParts: formData.affectedParts, severity: formData.severity }
      );
      const repairId = res.data.repair?.id || res.data?.repair?.id || res.data.id;
      if (formData.photos && formData.photos.length > 0 && repairId) {
        const fd = new FormData();
        formData.photos.forEach((p) => fd.append('photos', p));
        await repairPhotoService.uploadPhotos(repairId, fd);
      }
      setSuccess('Demande créée');
      setFormData({ title: '', description: '', bikeType: '', wheelSize: '', affectedParts: '', severity: 'minor', photos: [], location: '', locationLat: null, locationLng: null, locationAddress: '' });
      try { photoPreviews.forEach(p => URL.revokeObjectURL(p.url)); } catch (e) {}
      // Clear preview thumbnails and reset file input
      setPhotoPreviews([]);
      try { if (photosInputRef && photosInputRef.current) photosInputRef.current.value = null; } catch (e) {}
      // Reset map picker to initial state
      try { setMapResetCounter(c => c + 1); } catch (e) {}
      try { const r = await repairService.getMyRepairs(); setRepairs(r.data.repairs || []); } catch (e) {}
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard modern-dashboard">
      <header className="dashboard-header">
        <h1>🚲 Velo Platform</h1>
        <div className="user-info">
          <span className="user-name">{user?.name} <span className="user-role">({user?.role})</span></span>
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="dashboard-content">
        <nav className="dashboard-nav">
          {user?.role === 'client' ? (
            <>
              <button
                className={`nav-btn ${activeTab === 'repairs' ? 'active' : ''}`}
                onClick={() => setActiveTab('repairs')}
              >
                <span>🛠️ Mes demandes</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`}
                onClick={() => setActiveTab('create')}
              >
                <span>➕ Nouvelle demande</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'offers' ? 'active' : ''}`}
                onClick={() => setActiveTab('offers')}
              >
                <span>📩 Offres reçues</span>
              </button>
            </>
          ) : (
            <>
              <button
                className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}
                onClick={() => setActiveTab('explore')}
              >
                <span>🔎 Demandes à explorer</span>
              </button>
              <button
                className={`nav-btn ${activeTab === 'my-offers' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-offers')}
              >
                <span>💼 Mes offres</span>
              </button>
            </>
          )}
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
              <form onSubmit={handleCreateRepair} className="modern-form">
                <div className="form-group">
                  <label>Titre</label>
                  <input
                    type="text"
                    data-cy="repair-title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    data-cy="repair-description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    minLength="10"
                  />
                  <div className="suggestions">
                    <small>Suggestions: </small>
                    <button type="button" className="suggest-btn" onClick={() => setFormData(f => ({ ...f, description: 'Pneu crevé, besoin d\'une chambre à air' }))}>pneu crevé</button>
                    <button type="button" className="suggest-btn" onClick={() => setFormData(f => ({ ...f, description: 'Frein qui grince fortement' }))}>frein qui grince</button>
                    <button type="button" className="suggest-btn" onClick={() => setFormData(f => ({ ...f, description: 'Chaîne cassée après sortie' }))}>chaîne cassée</button>
                  </div>
                </div>
                <div className="form-group">
                  <label>Type de vélo</label>
                  <input
                    type="text"
                    data-cy="repair-bike-type"
                    value={formData.bikeType}
                    onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Taille de la roue</label>
                  <input
                    type="text"
                    placeholder="ex: 26 pouces, 28 pouces"
                    data-cy="repair-wheel-size"
                    value={formData.wheelSize}
                    onChange={(e) => setFormData({ ...formData, wheelSize: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Parties affectées</label>
                  <input
                    type="text"
                    placeholder="ex: chaîne, pneu, freins"
                    data-cy="repair-affected-parts"
                    value={formData.affectedParts}
                    onChange={(e) => setFormData({ ...formData, affectedParts: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Sévérité</label>
                  <select data-cy="repair-severity" value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })}>
                    <option value="minor">Mineure</option>
                    <option value="moderate">Modérée</option>
                    <option value="major">Importante</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Photos (optionnel) 📸</label>
                  <input ref={photosInputRef} data-cy="repair-photos" type="file" accept="image/*" capture="environment" multiple onChange={(e) => handlePhotosSelected(e.target.files)} />
                  {photoPreviews && photoPreviews.length > 0 && (
                    <div className="photo-previews">
                      {photoPreviews.map((p, i) => (
                        <div key={i} className="preview-item">
                          <img src={p.url} alt={p.name} style={{ height: 80 }} />
                          <div className="preview-meta">{p.name} - {Math.round((p.fileSize||0)/1024)}KB</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Localisation</label>
                  <MapPicker showConfirm={false} resetTrigger={mapResetCounter} initialPosition={{ lat: 48.8566, lng: 2.3522 }} onChange={(pos) => setFormData(f => ({ ...f, locationLat: pos.lat, locationLng: pos.lng, locationAddress: pos.address }))} />
                  <input
                    type="text"
                    data-cy="repair-location"
                    placeholder="Adresse (optionnel)"
                    value={formData.locationAddress || formData.location}
                    onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                  />
                </div>
                <button data-cy="repair-submit" type="submit" className="submit-btn" disabled={loading}>{loading ? 'Création...' : 'Créer la demande'}</button>
              </form>
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
