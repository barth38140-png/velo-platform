import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { repairService } from '../services/api';
import MapPicker from '../components/MapPicker';
import { ExploreRepairs } from './ExploreRepairs';
import { MyOffers } from './MyOffers';
import { OffersReceived } from './OffersReceived';
import { Profile } from './Profile';
import '../styles/Dashboard.css';
import '../styles/RepairForm.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user?.role === 'repairer' ? 'explore' : 'repairs');
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({ bikeType: '', problem: '', locationLat: null, locationLng: null, locationAddress: '' });
  const [mapResetCounter, setMapResetCounter] = useState(0);

  const toastTimeout = useRef();

  useEffect(() => {
    return () => { try { clearTimeout(toastTimeout.current); } catch (e) {} };
  }, []);

  const generateTitle = (f = formData) => {
    const problem = (f.problem || 'réparation').toString().trim();
    const type = (f.bikeType || '').toString().trim();
    let title = `Réparation ${problem}`;
    if (type) title += ` — ${type}`;
    if (f.locationAddress) {
      const shortAddr = String(f.locationAddress).split(',')[0];
      if (shortAddr) title += ` à ${shortAddr}`;
    }
    return title;
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Géolocalisation non supportée');
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

  const handleCreateRepair = async (e) => {
    e && e.preventDefault();
    setError('');
    if (!formData.bikeType || !formData.problem) return setError('Type et problème sont requis');
    setLoading(true);
    try {
      const title = generateTitle(formData);
      await repairService.createRepair(
        title,
        '',
        formData.bikeType,
        formData.locationLat,
        formData.locationLng,
        formData.locationAddress,
        {}
      );
      setSuccess('Demande envoyée');
      toastTimeout.current = setTimeout(() => setSuccess(''), 3000);
      setFormData({ bikeType: '', problem: '', locationLat: null, locationLng: null, locationAddress: '' });
      setMapResetCounter(c => c + 1);
      try { const r = await repairService.getMyRepairs(); setRepairs(r.data.repairs || []); } catch (e) {}
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

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
              <button className={`nav-btn ${activeTab === 'repairs' ? 'active' : ''}`} onClick={() => setActiveTab('repairs')}><span>🛠️ Mes demandes</span></button>
              <button className={`nav-btn ${activeTab === 'create' ? 'active' : ''}`} onClick={() => setActiveTab('create')}><span>➕ Nouvelle demande</span></button>
              <button className={`nav-btn ${activeTab === 'offers' ? 'active' : ''}`} onClick={() => setActiveTab('offers')}><span>📩 Offres reçues</span></button>
            </>
          ) : (
            <>
              <button className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}><span>🔎 Demandes à explorer</span></button>
              <button className={`nav-btn ${activeTab === 'my-offers' ? 'active' : ''}`} onClick={() => setActiveTab('my-offers')}><span>💼 Mes offres</span></button>
            </>
          )}
          <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><span>👤 Profil</span></button>
        </nav>

        <main className="dashboard-main">
          {error && <div className="error-toast">{error}</div>}
          {success && <div className="success-toast">{success}</div>}

          {activeTab === 'create' && (
            <div className="tab-content">
              <div className="repair-form-shell">
                <h2 className="repair-title">Nouvelle demande — rapide</h2>
                <p className="repair-sub">Type, problème, localisation — en une seule action.</p>

                <form onSubmit={handleCreateRepair} className="modern-form">
                  <label className="label">Type de vélo</label>
                  <select data-cy="repair-bike-type" value={formData.bikeType} onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })} required style={{padding:10, borderRadius:8, width:'100%'}}>
                    <option value="">Sélectionner le type</option>
                    <option value="VTC">VTC</option>
                    <option value="VTT">VTT</option>
                    <option value="Ville">Ville</option>
                    <option value="Electrique">Électrique</option>
                  </select>

                  <label className="label" style={{marginTop:12}}>Problème principal</label>
                  <div className="issue-icons" style={{marginBottom:12}}>
                    <button type="button" className={`issue-btn ${formData.problem==='pneu'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'pneu' }))}>🔧 Pneu</button>
                    <button type="button" className={`issue-btn ${formData.problem==='freins'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'freins' }))}>🛠️ Freins</button>
                    <button type="button" className={`issue-btn ${formData.problem==='chaine'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'chaine' }))}>🔗 Chaîne</button>
                    <button type="button" className={`issue-btn ${formData.problem==='autre'?'active':''}`} onClick={() => setFormData(f => ({ ...f, problem: 'autre' }))}>⚙️ Autre</button>
                  </div>

                  <label className="label">Localisation</label>
                  <div className="location-row">
                    <MapPicker showConfirm={false} showAddress={true} showSearch={false} showCoords={false} resetTrigger={mapResetCounter} initialPosition={{ lat: 48.8566, lng: 2.3522 }} onChange={(pos) => setFormData(f => ({ ...f, locationLat: pos.lat, locationLng: pos.lng, locationAddress: pos.address }))} />
                  </div>
                  <input type="text" data-cy="repair-location" placeholder="Adresse (optionnel)" value={formData.locationAddress || ''} onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })} />
                  <div className="location-actions">
                    <button type="button" className="btn tertiary" onClick={useMyLocation}>Utiliser ma position</button>
                    <small className="micro">Localisation précise aide le mécanicien.</small>
                  </div>

                  <div style={{display:'flex', justifyContent:'center', marginTop:18}}>
                    <button data-cy="repair-submit" type="submit" className="btn primary" style={{padding:'12px 22px', fontSize:16}} disabled={loading || !formData.bikeType || !formData.problem}>{loading ? 'Création...' : 'Envoyer ma demande'}</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'repairs' && (
            <div className="tab-content">
              <h2>Mes demandes de réparation</h2>
              {repairs.length > 0 ? (
                <div className="repairs-list">
                  {repairs.map(repair => (
                    <div key={repair.id} className="repair-card">
                      <div className="repair-card-header"><h3>{repair.title}</h3><span className={`status-badge status-${repair.status?.toLowerCase()}`}>{repair.status}</span></div>
                      <p>{repair.description}</p>
                      <div className="repair-meta"><span className="meta-type">🚲 {repair.bike_type}</span><span className="meta-location">📍 {repair.location_address || repair.location || 'N/A'}</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-list">Aucune demande pour l’instant</p>
              )}
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

export default Dashboard;


