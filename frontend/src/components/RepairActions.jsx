import React, { useState } from 'react';
import { repairService } from '../services/api';
import '../styles/RepairActions.css';

/**
 * Composant pour gérer les transitions de statut d'une demande de réparation
 * Affiche les boutons appropriés selon le statut actuel et le rôle de l'utilisateur
 */
export default function RepairActions({ repair, userRole, userId, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!repair) return null;

  const handleStart = async () => {
    setLoading(true);
    setError('');
    try {
      const resp = await repairService.startRepair(repair.id);
      if (onUpdate) onUpdate(resp.data.repair);
      window.dispatchEvent(new CustomEvent('repairStatusChanged', { detail: { repairId: repair.id, status: 'en_cours' } }));
    } catch (err) {
      setError(err?.response?.data?.error || 'Impossible de démarrer la réparation');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!window.confirm('Confirmer la finalisation de cette réparation ?')) return;
    setLoading(true);
    setError('');
    try {
      const resp = await repairService.completeRepair(repair.id);
      if (onUpdate) onUpdate(resp.data.repair);
      window.dispatchEvent(new CustomEvent('repairStatusChanged', { detail: { repairId: repair.id, status: 'terminée' } }));
    } catch (err) {
      setError(err?.response?.data?.error || 'Impossible de finaliser la réparation');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Confirmer l\'annulation de cette demande ?')) return;
    setLoading(true);
    setError('');
    try {
      await repairService.updateRepairStatus(repair.id, 'annulée');
      if (onUpdate) onUpdate({ ...repair, status: 'annulée' });
      window.dispatchEvent(new CustomEvent('repairStatusChanged', { detail: { repairId: repair.id, status: 'annulée' } }));
    } catch (err) {
      setError(err?.response?.data?.error || 'Impossible d\'annuler la demande');
    } finally {
      setLoading(false);
    }
  };

  // Déterminer les actions disponibles selon le statut et le rôle
  const isRepairer = userRole === 'repairer';
  const isClient = userRole === 'client';
  const isAssignedRepairer = isRepairer && repair.assigned_repairer_id === userId;
  const isOwner = isClient && repair.user_id === userId;

  const canStart = isAssignedRepairer && repair.status === 'assignée';
  const canComplete = (isAssignedRepairer || isOwner) && repair.status === 'en_cours';
  const canCancel = isOwner && ['créée', 'en_attente'].includes(repair.status);

  if (!canStart && !canComplete && !canCancel) {
    return null; // Pas d'actions disponibles
  }

  return (
    <div className="repair-actions">
      {error && <div className="error-message">{error}</div>}
      
      <div className="actions-buttons">
        {canStart && (
          <button 
            className="btn primary" 
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? 'Chargement...' : '🔧 Démarrer la réparation'}
          </button>
        )}

        {canComplete && (
          <button 
            className="btn success" 
            onClick={handleComplete}
            disabled={loading}
          >
            {loading ? 'Chargement...' : '✅ Finaliser la réparation'}
          </button>
        )}

        {canCancel && (
          <button 
            className="btn danger" 
            onClick={handleCancel}
            disabled={loading}
          >
            {loading ? 'Chargement...' : '❌ Annuler la demande'}
          </button>
        )}
      </div>
    </div>
  );
}
