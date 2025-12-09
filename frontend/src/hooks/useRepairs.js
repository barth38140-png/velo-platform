import { useState, useEffect, useCallback } from 'react';
import { repairService } from '../services/api';

/**
 * Hook pour gérer la récupération et le rafraîchissement des demandes de réparation
 * @returns { repairs, loading, error, refresh }
 */
export function useRepairs() {
  const [repairs, setRepairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRepairs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await repairService.getMyRepairs();
      setRepairs(res.data?.repairs || []);
    } catch (err) {
      setError('Erreur lors du chargement des demandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRepairs();
    const handler = () => fetchRepairs();
    window.addEventListener('offerStatusChanged', handler);
    return () => window.removeEventListener('offerStatusChanged', handler);
  }, [fetchRepairs]);

  return { repairs, loading, error, refresh: fetchRepairs };
}
