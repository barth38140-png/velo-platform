
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { repairService } from '../services/api';
import { socket } from '../services/socket';
import { ExploreRepairs } from './ExploreRepairs';
import { MyOffers } from './MyOffers';
import { OffersReceived } from './OffersReceived';
import { Profile } from './Profile';
import '../styles/Dashboard.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(user?.role === 'repairer' ? 'explore' : 'repairs');
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [realtimeMsg, setRealtimeMsg] = useState('');
  const toastTimeout = useRef();
    // Socket.io: connexion et gestion des notifications temps réel
    useEffect(() => {
      if (!user) return;
      socket.auth = { token: localStorage.getItem('token') };
      socket.connect();

      // Notification pour nouvelle offre
      socket.on('new_offer', (data) => {
        setRealtimeMsg('📩 Nouvelle offre reçue sur une de vos demandes !');
        clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setRealtimeMsg(''), 5000);
      });
      // Notification pour changement de statut
      socket.on('status_update', (data) => {
        setRealtimeMsg(`🔔 Statut mis à jour : ${data.status}`);
        clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setRealtimeMsg(''), 5000);
      });
      // Notification pour nouveau message
      socket.on('new_message', (data) => {
        setRealtimeMsg('💬 Nouveau message reçu !');
        clearTimeout(toastTimeout.current);
        toastTimeout.current = setTimeout(() => setRealtimeMsg(''), 5000);
      });

      return () => {
        socket.off('new_offer');
        socket.off('status_update');
        socket.off('new_message');
        socket.disconnect();
        clearTimeout(toastTimeout.current);
      };
    }, [user]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bikeType: '',
    location: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      loadRepairs();
    }
  }, [user, navigate]);

  const loadRepairs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await repairService.getMyRepairs();
      setRepairs(response.data.repairs || []);
    } catch (err) {
      setError('Échec du chargement des demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRepair = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await repairService.createRepair(
        formData.title,
        formData.description,
        formData.bikeType,
        48.8566,
        2.3522,
        formData.location
      );
      setFormData({ title: '', description: '', bikeType: '', location: '' });
      setSuccess('Demande créée avec succès !');
      loadRepairs();
    } catch (err) {
      setError(err.response?.data?.error || 'Échec de la création de la demande');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
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
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    minLength="10"
                  />
                </div>
                <div className="form-group">
                  <label>Type de vélo</label>
                  <input
                    type="text"
                    value={formData.bikeType}
                    onChange={(e) => setFormData({ ...formData, bikeType: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Localisation</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>{loading ? 'Création...' : 'Créer la demande'}</button>
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
