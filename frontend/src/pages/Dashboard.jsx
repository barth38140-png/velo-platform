import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { repairService } from '../services/api';
// Note: creation moved to Demandes & Offres modal; remove inline create imports
import { ExploreRepairs } from './ExploreRepairs';
import { MyOffers } from './MyOffers';
import { Profile } from './Profile';
import DemandesOffresPage from './DemandesOffresPage';
import ConversationsList from '../components/ConversationsList';
import MesVelos from './MesVelos';
import { Repairers } from './Repairers';
import RepairerAvailability from './RepairerAvailability';
import '../styles/Dashboard.css';
import '../styles/RepairForm.css';

export function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Rediriger les admins vers le dashboard admin
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user?.role, navigate]);

  const initialTab = (() => {
    const params = new URLSearchParams(location.search);
    const qtab = params.get('tab');
    if (qtab) return qtab;
    return user?.role === 'repairer' ? 'explore' : 'demandes-offres';
  })();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [mesVelosNonce, setMesVelosNonce] = useState(0);
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [initialConversationId, setInitialConversationId] = useState(null);

  // creation moved to modal in DemandesOffresPage; inline create state removed

  const toastTimeout = useRef();

  useEffect(() => {
    return () => {
      if (toastTimeout.current) clearTimeout(toastTimeout.current);
    };
  }, []);

  // Navigation déclenchée par des événements (ex: ouverture messagerie depuis une autre vue)
  useEffect(() => {
    const onOpenMessages = (e) => {
      setActiveTab('messages');
      if (e?.detail?.conversationId) {
        setInitialConversationId(e.detail.conversationId);
      }
      // Optionnel: passer un identifiant de conversation au composant de messagerie
      // e.detail?.conversationId peut être utilisé via un state/context si nécessaire
    };
    window.addEventListener('openMessages', onOpenMessages);
    return () => window.removeEventListener('openMessages', onOpenMessages);
  }, []);

  // inline create logic removed; creation handled via modal in DemandesOffresPage

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
          {user?.role === 'repairer' && (
            <>
              <button className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => setActiveTab('explore')}><span>🔎 Demandes à explorer</span></button>
              <button className={`nav-btn ${activeTab === 'my-offers' ? 'active' : ''}`} onClick={() => setActiveTab('my-offers')}><span>💼 Mes offres</span></button>
              <button className={`nav-btn ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => setActiveTab('availability')}><span>📅 Disponibilités</span></button>
            </>
          )}
          {user?.role !== 'repairer' && (
            <button className={`nav-btn ${activeTab === 'repairers' ? 'active' : ''}`} onClick={() => setActiveTab('repairers')}><span>🛠️ Réparateurs</span></button>
          )}
          <button className={`nav-btn ${activeTab === 'demandes-offres' ? 'active' : ''}`} onClick={() => setActiveTab('demandes-offres')}><span>📬 Demandes & Offres</span></button>
          <button className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}><span>💬 Messagerie</span></button>
          <button className={`nav-btn ${activeTab === 'mes-velos' ? 'active' : ''}`} onClick={() => { setActiveTab('mes-velos'); setMesVelosNonce(n => n + 1); }}><span>🚲 Mes vélos</span></button>
          <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}><span>👤 Profil</span></button>
        </nav>

        <main className="dashboard-main">
          {error && <div className="error-toast">{error}</div>}
          {success && <div className="success-toast">{success}</div>}

          {/* 'Nouvelle demande' tab removed — creation now via modal inside Demandes & Offres */}

          {/* Mes demandes and Offres reçues removed per request */}

          {/* Demandes & Offres page removed */}

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

          {activeTab === 'mes-velos' && (
            <div className="tab-content">
              <MesVelos resetSignal={mesVelosNonce} />
            </div>
          )}

          {activeTab === 'demandes-offres' && (
            <div className="tab-content">
              <DemandesOffresPage />
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="tab-content">
              {/* Messagerie centralisée, pas de redondance d'écrans */}
              <ConversationsList token={user?.token} userId={user?.id} initialConversationId={initialConversationId} />
            </div>
          )}

          {activeTab === 'repairers' && (
            <div className="tab-content">
              <Repairers />
            </div>
          )}

          {activeTab === 'availability' && user?.role === 'repairer' && (
            <div className="tab-content">
              <RepairerAvailability />
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

export default Dashboard;


