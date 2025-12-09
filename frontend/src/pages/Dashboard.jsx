import React, { useState, useEffect, useRef } from 'react';
import Loader from '../components/Loader';
import '../styles/Loader.css';
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

function Dashboard() {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [navOpen, setNavOpen] = useState(false);
  // Fermer le menu nav sur navigation ou resize > 900px
  useEffect(() => {
    const onResize = () => { if(window.innerWidth > 900) setNavOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Rediriger les admins vers le dashboard admin
  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [user?.role, navigate]);

  // Synchronisation onglet et conversation avec l'URL
  const getParams = () => new URLSearchParams(window.location.search);
  const getTab = () => getParams().get('tab');
  const getConvId = () => getParams().get('conversationId');
  // Onglet initial selon le rôle utilisateur
  const [activeTab, setActiveTab] = useState(() => {
    if (user?.role === 'repairer') return 'explore';
    return 'repairers';
  });
  const [initialConversationId, setInitialConversationId] = useState(getConvId() || null);
  const [mesVelosNonce, setMesVelosNonce] = useState(0);
  const [repairs, setRepairs] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Mise à jour de l'onglet et de la conversation à chaque navigation
  // Toujours synchroniser l'onglet et la conversation avec l'URL à chaque rendu
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qtab = params.get('tab');
    const qConvId = params.get('conversationId');
    // Pour les réparateurs, forcer l'onglet 'explore' à la première connexion
    if (user?.role === 'repairer' && !qtab) {
      setActiveTab('explore');
    } else if (qtab) {
      setActiveTab(qtab);
    }
    if (qConvId) setInitialConversationId(qConvId);
    if (qtab === 'messages' && !qConvId) setInitialConversationId(null);
  }, [window.location.search, user?.role]);

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

  // Affiche le loader si le contexte Auth est en chargement
  if (loading) {
    return <Loader message="Chargement du tableau de bord..." />;
  }
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
        {/* Bouton burger mobile */}
        <button
          className="nav-burger"
          aria-label="Ouvrir la navigation"
          style={{
            display: window.innerWidth < 900 ? 'block' : 'none',
            position: 'absolute',
            top: 18,
            left: 18,
            zIndex: 1001,
            background: 'white',
            border: '2px solid #667eea',
            borderRadius: 8,
            padding: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
          }}
          onClick={() => setNavOpen(v => !v)}
        >
          <span style={{fontSize:'1.7em'}}>☰</span>
        </button>
        {/* Overlay navigation mobile */}
        <nav
          className={`dashboard-nav${navOpen ? ' nav-open' : ''}`}
          style={window.innerWidth < 900 ? {
            position: 'fixed',
            top: 0,
            left: navOpen ? 0 : '-100vw',
            width: '80vw',
            maxWidth: 320,
            height: '100vh',
            background: '#fff',
            boxShadow: navOpen ? '2px 0 16px rgba(0,0,0,0.13)' : 'none',
            zIndex: 1002,
            flexDirection: 'column',
            alignItems: 'flex-start',
            padding: '32px 18px 18px 18px',
            transition: 'left 0.25s cubic-bezier(.4,2,.6,1)',
            gap: 16,
          } : {}}
        >
          {/* Bouton fermer mobile */}
          {window.innerWidth < 900 && (
            <button
              aria-label="Fermer la navigation"
              style={{position:'absolute',top:12,right:12,background:'none',border:'none',fontSize:'2em',color:'#667eea',cursor:'pointer'}}
              onClick={() => setNavOpen(false)}
            >×</button>
          )}
          {user?.role === 'repairer' && (
            <>
              <button className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`} onClick={() => { setActiveTab('explore'); setNavOpen(false); }}><span>🔎 Demandes à explorer</span></button>
              <button className={`nav-btn ${activeTab === 'my-offers' ? 'active' : ''}`} onClick={() => { setActiveTab('my-offers'); setNavOpen(false); }}><span>💼 Mes offres</span></button>
              <button className={`nav-btn ${activeTab === 'availability' ? 'active' : ''}`} onClick={() => { setActiveTab('availability'); setNavOpen(false); }}><span>📅 Disponibilités</span></button>
            </>
          )}
          {user?.role !== 'repairer' && (
            <button className={`nav-btn ${activeTab === 'repairers' ? 'active' : ''}`} onClick={() => { setActiveTab('repairers'); setNavOpen(false); }}><span>🛠️ Réparateurs</span></button>
          )}
          <button className={`nav-btn ${activeTab === 'demandes-offres' ? 'active' : ''}`} onClick={() => { setActiveTab('demandes-offres'); setNavOpen(false); }}><span>📬 Demandes & Offres</span></button>
          <button className={`nav-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => { setActiveTab('messages'); setNavOpen(false); }}><span>💬 Messagerie</span></button>
          <button className={`nav-btn ${activeTab === 'mes-velos' ? 'active' : ''}`} onClick={() => { setActiveTab('mes-velos'); setMesVelosNonce(n => n + 1); setNavOpen(false); }}><span>🚲 Mes vélos</span></button>
          <button className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => { setActiveTab('profile'); setNavOpen(false); }}><span>👤 Profil</span></button>
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
              <ConversationsList
                token={user?.token}
                userId={user?.id}
                initialConversationId={getConvId() || initialConversationId}
              />
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


