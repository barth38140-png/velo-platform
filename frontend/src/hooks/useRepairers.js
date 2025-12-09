import { useState, useMemo, useEffect } from 'react';

/**
 * Hook personnalisé pour la gestion des réparateurs, filtres, pagination et favoris
 * @param {Array} repairers - Liste brute des réparateurs
 * @param {Object} options - Toutes les options de filtrage
 * @returns {Object} - { filtered, paginated, favorites, toggleFavorite, ... }
 */
export default function useRepairers(repairers, options) {
  const {
    query = '',
    selectedSkills = [],
    minRating = 0,
    maxDistance = 0,
    showOnlyFavorites = false,
    favoritesInit = [],
    nearbyOnly = true,
    onlyAvailable = false,
    page = 1,
    pageSize = 10
  } = options;

  const [favorites, setFavorites] = useState(favoritesInit);

  // Filtrage principal
  const filtered = useMemo(() => {
    let list = Array.isArray(repairers) ? repairers : [];
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(r =>
        (r.name && r.name.toLowerCase().includes(q)) ||
        (r.display_name && r.display_name.toLowerCase().includes(q)) ||
        (r.bio && r.bio.toLowerCase().includes(q)) ||
        (Array.isArray(r.skills) ? r.skills : (r.skills ? String(r.skills).split(',') : [])).some(s => s && s.toLowerCase().includes(q))
      );
    }
    if (selectedSkills.length > 0) {
      list = list.filter(r =>
        selectedSkills.every(skill =>
          (Array.isArray(r.skills) ? r.skills : (r.skills ? String(r.skills).split(',') : [])).map(s => s.trim()).includes(skill)
        )
      );
    }
    if (minRating > 0) {
      list = list.filter(r => (r.rating || 0) >= minRating);
    }
    if (maxDistance > 0) {
      list = list.filter(r => (r.distance || 0) <= maxDistance);
    }
    if (showOnlyFavorites) {
      list = list.filter(r => favorites.includes(r.id || r.user_id));
    }
    // Filtre nearbyOnly supprimé : on affiche tous les réparateurs, peu importe la distance
    if (onlyAvailable) {
      list = list.filter(r => r.available === true);
    }
    return list;
  }, [repairers, query, selectedSkills, minRating, maxDistance, showOnlyFavorites, favorites, nearbyOnly, onlyAvailable]);

  // Pagination
  const paginated = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  // Gestion des favoris
  const toggleFavorite = (repairer) => {
    const id = repairer.id || repairer.user_id;
    setFavorites(favs => {
      let next;
      if (favs.includes(id)) {
        next = favs.filter(f => f !== id);
      } else {
        next = [...favs, id];
      }
      localStorage.setItem('repairers_favorites', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    // Synchronise les favoris avec le localStorage au montage
    try {
      const stored = JSON.parse(localStorage.getItem('repairers_favorites') || '[]');
      setFavorites(stored);
    } catch (e) {}
  }, []);

  return {
    filtered,
    paginated,
    favorites,
    toggleFavorite
  };
}
