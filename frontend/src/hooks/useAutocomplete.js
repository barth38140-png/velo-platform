import { useState, useEffect } from 'react';

/**
 * Hook pour gérer l'autocomplétion des réparateurs (noms, compétences)
 * @param {string} query - Texte de recherche
 * @param {Array} repairers - Liste des réparateurs
 * @param {Array} allSkills - Liste des compétences
 * @returns {Array} autocomplete - Suggestions
 */
export default function useAutocomplete(query, repairers, allSkills) {
  const [autocomplete, setAutocomplete] = useState([]);

  useEffect(() => {
    if (!query) { setAutocomplete([]); return; }
    const q = query.toLowerCase();
    const names = repairers.map(r => r.name || r.display_name || '').filter(Boolean);
    const skills = allSkills;
    const suggestions = [
      ...names.filter(n => n && n.toLowerCase().includes(q)),
      ...skills.filter(s => s && s.toLowerCase().includes(q))
    ].slice(0, 8);
    setAutocomplete(suggestions);
  }, [query, repairers, allSkills]);

  return autocomplete;
}
