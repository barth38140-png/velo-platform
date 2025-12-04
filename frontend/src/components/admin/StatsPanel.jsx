import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import '../../styles/AdminComponents.css';

export default function StatsPanel({ stats, onRefresh }) {
  const [period, setPeriod] = useState('7d');
  const [revenue, setRevenue] = useState(null);
  const [charts, setCharts] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const [revRes, chartRes] = await Promise.all([
        adminService.getRevenueStats(period),
        adminService.getActivityCharts(period)
      ]);
      setRevenue(revRes.data.revenue);
      setCharts(chartRes.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des statistiques');
    }
  };

  return (
    <div className="stats-panel">
      <div className="stats-header">
        <h2>📊 Vue d'ensemble</h2>
        <div className="period-selector">
          {['7d', '30d', '90d'].map(p => (
            <button
              key={p}
              className={`period-btn ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 jours' : p === '30d' ? '30 jours' : '90 jours'}
            </button>
          ))}
        </div>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>👥 Utilisateurs totaux</h3>
            <p className="stat-value">{stats.total_users}</p>
            <small>
              {stats.total_repairers} réparateurs, {stats.total_clients} clients
            </small>
          </div>

          <div className="stat-card">
            <h3>🔧 Réparations ({period})</h3>
            <p className="stat-value">{stats[`repairs_${period}`]}</p>
            <small>{stats[`repairs_completed_${period}`]} complétées</small>
          </div>

          <div className="stat-card">
            <h3>⭐ Avis ({period})</h3>
            <p className="stat-value">{stats[`reviews_${period}`]}</p>
            <small>Note moyenne: {stats[`avg_rating_${period}`]?.toFixed(2)}</small>
          </div>

          <div className="stat-card">
            <h3>✅ Réparateurs vérifiés</h3>
            <p className="stat-value">{stats.verified_repairers}</p>
            <small>{stats.suspended_users} suspendus</small>
          </div>
        </div>
      )}

      {revenue && (
        <div className="revenue-section">
          <h3>💰 Revenue Estimé</h3>
          <div className="revenue-grid">
            <div className="revenue-card">
              <h4>Revenu estimé</h4>
              <p className="revenue-value">€{revenue.estimated_revenue}</p>
            </div>
            <div className="revenue-card">
              <h4>Réparations complétées</h4>
              <p className="revenue-value">{revenue.completed_repairs}</p>
            </div>
            <div className="revenue-card">
              <h4>Valeur moyenne</h4>
              <p className="revenue-value">€{revenue.avg_repair_value}</p>
            </div>
          </div>

          <h4 style={{ marginTop: '24px' }}>🏆 Top Réparateurs</h4>
          <table className="top-repairers-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Réparations</th>
                <th>Note</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {revenue.top_repairers?.map(r => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.repairs_completed}</td>
                  <td>⭐ {r.avg_rating || 'N/A'}</td>
                  <td>€{r.estimated_revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
