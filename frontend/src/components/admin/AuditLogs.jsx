import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import '../../styles/AdminComponents.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [page, setPage] = useState(1);
  const [expandedLog, setExpandedLog] = useState(null);
  const toast = useToast();

  useEffect(() => {
    loadLogs();
  }, [page, filterAction, filterUser]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAuditLogs(page, {
        action: filterAction === 'all' ? null : filterAction,
        user_id: filterUser || null
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  };

  const actionColors = {
    'user_created': '✨',
    'user_updated': '✏️',
    'user_suspended': '⏸️',
    'user_banned': '🚫',
    'review_flagged': '🚩',
    'message_flagged': '🚩',
    'repair_completed': '✅',
    'login': '🔐',
    'logout': '🔒',
    'admin_action': '⚙️'
  };

  return (
    <div className="audit-logs">
      <h2>🛠️ Logs d'audit</h2>

      <div className="audit-filters">
        <select
          value={filterAction}
          onChange={(e) => {
            setFilterAction(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">Toutes les actions</option>
          <option value="user_created">Utilisateur créé</option>
          <option value="user_updated">Utilisateur modifié</option>
          <option value="user_suspended">Utilisateur suspendu</option>
          <option value="user_banned">Utilisateur banni</option>
          <option value="review_flagged">Avis signalé</option>
          <option value="message_flagged">Message signalé</option>
          <option value="repair_completed">Réparation complétée</option>
          <option value="admin_action">Action admin</option>
        </select>

        <input
          type="text"
          placeholder="Filtrer par ID utilisateur..."
          value={filterUser}
          onChange={(e) => {
            setFilterUser(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <>
          <table className="audit-table">
            <thead>
              <tr>
                <th>Horodatage</th>
                <th>Action</th>
                <th>Utilisateur</th>
                <th>Ressource</th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <React.Fragment key={log.id}>
                  <tr
                    className="audit-row"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <td>{new Date(log.created_at).toLocaleString('fr-FR')}</td>
                    <td>
                      <span className="action-badge">
                        {actionColors[log.action] || '📝'} {log.action}
                      </span>
                    </td>
                    <td>{log.user_name || `ID: ${log.user_id}`}</td>
                    <td>{log.resource_type}#{log.resource_id}</td>
                    <td>
                      <button
                        className="btn btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedLog(expandedLog === log.id ? null : log.id);
                        }}
                      >
                        {expandedLog === log.id ? '▼' : '▶'}
                      </button>
                    </td>
                  </tr>

                  {expandedLog === log.id && (
                    <tr className="audit-details">
                      <td colSpan="5">
                        <div className="details-content">
                          <h4>Détails complets</h4>
                          <pre>{JSON.stringify(log.details || {}, null, 2)}</pre>
                          {log.change_description && (
                            <>
                              <h4>Description du changement</h4>
                              <p>{log.change_description}</p>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ← Précédent
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 10}>
              Suivant →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
