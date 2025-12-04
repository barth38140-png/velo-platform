import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useToast } from '../context/ToastContext';
import UserManagement from '../components/admin/UserManagement';
import ModerationPanel from '../components/admin/ModerationPanel';
import StatsPanel from '../components/admin/StatsPanel';
import AuditLogs from '../components/admin/AuditLogs';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('stats');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await adminService.getGlobalStats();
      setStats(res.data.stats);
    } catch (err) {
      toast.error('Impossible de charger les statistiques');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'stats', label: '📊 Statistiques', icon: '📈' },
    { id: 'users', label: '👥 Utilisateurs', icon: '👤' },
    { id: 'moderation', label: '📋 Modération', icon: '⚠️' },
    { id: 'audit', label: '🛠️ Logs d\'audit', icon: '📝' }
  ];

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>🔧 Tableau de Bord Administration</h1>
        <p>Gestion complète de la plateforme</p>
      </header>

      <nav className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="admin-content">
        {loading && activeTab === 'stats' ? (
          <div className="loading-spinner">Chargement des données...</div>
        ) : (
          <>
            {activeTab === 'stats' && <StatsPanel stats={stats} onRefresh={loadStats} />}
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'moderation' && <ModerationPanel />}
            {activeTab === 'audit' && <AuditLogs />}
          </>
        )}
      </main>
    </div>
  );
}
