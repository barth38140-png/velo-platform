import React, { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';
import { useToast } from '../../context/ToastContext';
import '../../styles/AdminComponents.css';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const toast = useToast();

  useEffect(() => {
    loadUsers();
  }, [page, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await adminService.getAllUsers(page, {
        role: filterRole === 'all' ? null : filterRole,
        status: filterStatus === 'all' ? null : filterStatus,
        search: search || null
      });
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const toggleUserStatus = async (userId, action) => {
    try {
      await adminService.toggleUserStatus(userId, action);
      toast.success(`Utilisateur ${action}é avec succès`);
      loadUsers();
    } catch (err) {
      toast.error('Erreur lors de la modification de l\'utilisateur');
    }
  };

  const verifyRepairer = async (userId) => {
    try {
      await adminService.verifyRepairer(userId);
      toast.success('Réparateur vérifié avec succès');
      loadUsers();
    } catch (err) {
      toast.error('Erreur lors de la vérification');
    }
  };

  return (
    <div className="user-management">
      <h2>👥 Gestion des utilisateurs</h2>

      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Rechercher par email, nom..."
            value={search}
            onChange={handleSearch}
          />
        </div>

        <div className="filter-controls">
          <select value={filterRole} onChange={(e) => {
            setFilterRole(e.target.value);
            setPage(1);
          }}>
            <option value="all">Tous les rôles</option>
            <option value="client">Clients</option>
            <option value="repairer">Réparateurs</option>
          </select>

          <select value={filterStatus} onChange={(e) => {
            setFilterStatus(e.target.value);
            setPage(1);
          }}>
            <option value="all">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="suspended">Suspendus</option>
            <option value="banned">Bannis</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <>
          <table className="users-table">
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Inscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge badge-${user.role}`}>
                      {user.role === 'repairer' ? '🔧 Réparateur' : '👤 Client'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge status-${user.status}`}>
                      {user.status === 'active' && '✅ Actif'}
                      {user.status === 'suspended' && '⏸️ Suspendu'}
                      {user.status === 'banned' && '🚫 Banni'}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                  <td className="actions-cell">
                    {user.status === 'active' && (
                      <button
                        className="btn btn-warning"
                        onClick={() => toggleUserStatus(user.id, 'suspend')}
                      >
                        Suspendre
                      </button>
                    )}
                    {user.status === 'suspended' && (
                      <button
                        className="btn btn-success"
                        onClick={() => toggleUserStatus(user.id, 'activate')}
                      >
                        Activer
                      </button>
                    )}
                    {user.role === 'repairer' && !user.is_verified && (
                      <button
                        className="btn btn-primary"
                        onClick={() => verifyRepairer(user.id)}
                      >
                        ✅ Vérifier
                      </button>
                    )}
                    {user.status !== 'banned' && (
                      <button
                        className="btn btn-danger"
                        onClick={() => toggleUserStatus(user.id, 'ban')}
                      >
                        Bannir
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              ← Précédent
            </button>
            <span>Page {page}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={users.length < 10}>
              Suivant →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
