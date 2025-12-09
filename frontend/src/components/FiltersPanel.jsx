import React, { useState } from 'react';
import '../../styles/filters-panel.css';

/**
 * Composant panneau de filtres premium (drawer/modal)
 * Props : voir Repairers.jsx
 */
function FiltersPanel({
  query, setQuery, searchInputRef, autocomplete, setAutocomplete, setPage,
  selectedSkills, setSelectedSkills, allSkills,
  minRating, setMinRating, maxDistance, setMaxDistance,
  showOnlyFavorites, setShowOnlyFavorites, compactView, setCompactView,
  nearbyOnly, setNearbyOnly, onlyAvailable, setOnlyAvailable,
  sortBy, setSortBy, distanceAsc, setDistanceAsc,
  filtered, repairers, setFiltersOpen
}) {
  // État d'ouverture/repli pour chaque section
  const [openSection, setOpenSection] = useState('recherche');
  return (
    <div className="filters-panel" role="region" aria-label="Filtres de recherche">
      <div className="filters-header">
        <span role="img" aria-label="Filtres">🧰</span> Filtres
        <button className="close-filters" onClick={() => setFiltersOpen(false)} aria-label="Fermer les filtres">×</button>
      </div>
      {/* Section Recherche */}
      <div className="filters-section">
        <div className="filters-section-title" style={{cursor:'pointer'}} onClick={()=>setOpenSection(openSection==='recherche'?null:'recherche')}>
          <span role="img" aria-label="Recherche">🔍</span> Recherche
          <span style={{marginLeft:6,fontWeight:700}}>{openSection==='recherche'?'−':'+'}</span>
        </div>
        {openSection==='recherche' && <>
        <label htmlFor="repairers-search" className="filter-label">Recherche</label>
        <div className="filter-group">
          <input
            id="repairers-search"
            ref={searchInputRef}
            type="text"
            placeholder={query ? "Nom, compétence ou bio…" : "Ex : Pierre, réparation, Paris…"}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            aria-label="Recherche réparateur"
            className="filter-input"
          />
          {autocomplete.length > 0 ? (
            <ul className="autocomplete-list">
              {autocomplete.map((s,i) => (
                <li key={i} onMouseDown={() => { setQuery(s); setAutocomplete([]); setPage(1); }}>{s}</li>
              ))}
            </ul>
          ) : null}
        </div>
        </>}
      </div>
      {/* Section Compétences */}
      <div className="filters-section">
        <div className="filters-section-title" style={{cursor:'pointer'}} onClick={()=>setOpenSection(openSection==='competences'?null:'competences')}>
          <span role="img" aria-label="Compétences">🛠️</span> Compétences
          <span style={{marginLeft:6,fontWeight:700}}>{openSection==='competences'?'−':'+'}</span>
        </div>
        {openSection==='competences' && <>
        <label htmlFor="skills-filter" className="filter-label">Compétences</label>
        <div className="filter-group">
          <select id="skills-filter" multiple value={selectedSkills} onChange={e => {
            const opts = Array.from(e.target.selectedOptions).map(o => o.value);
            setSelectedSkills(opts); setPage(1);
          }} className="filter-select" aria-label="Compétences">
            {allSkills.map((s,i) => <option key={i} value={s}>{s}</option>)}
          </select>
          <div className="skills-chips">
            {selectedSkills.map(skill => (
              <span key={skill} className="chip">
                {skill}
                <button
                  type="button"
                  className="chip-remove"
                  aria-label={`Retirer ${skill}`}
                  onClick={() => {
                    setSelectedSkills(selectedSkills.filter(s => s !== skill));
                    setPage(1);
                  }}
                >×</button>
              </span>
            ))}
          </div>
        </div>
        </>}
      </div>
      {/* Section Critères */}
      <div className="filters-section filters-section-criteria">
        <div className="filters-section-title" style={{cursor:'pointer'}} onClick={()=>setOpenSection(openSection==='criteres'?null:'criteres')}>
          <span role="img" aria-label="Critères">⚙️</span> Critères
          <span style={{marginLeft:6,fontWeight:700}}>{openSection==='criteres'?'−':'+'}</span>
        </div>
        {openSection==='criteres' && <>
        <div className="filter-group">
          <label htmlFor="min-rating" className="filter-label">Note minimale <span role="img" aria-label="Note minimale">★</span></label>
          <input id="min-rating" type="number" min={0} max={5} step={0.1} value={minRating} onChange={e => { setMinRating(Number(e.target.value)); setPage(1); }} className="filter-input" placeholder="Note min" aria-label="Note minimale" />
        </div>
        <div className="filter-group">
          <label htmlFor="max-distance" className="filter-label">Distance max <span role="img" aria-label="Distance max">📍</span></label>
          <input id="max-distance" type="number" min={0} max={1000} step={1} value={maxDistance} onChange={e => { setMaxDistance(Number(e.target.value)); setPage(1); }} className="filter-input" placeholder="Distance max (km)" aria-label="Distance max (km)" />
        </div>
        </>}
      </div>
      {/* Section Options */}
      <div className="filters-section filters-section-options">
        <div className="filters-section-title" style={{cursor:'pointer'}} onClick={()=>setOpenSection(openSection==='options'?null:'options')}>
          <span role="img" aria-label="Options">🔧</span> Options
          <span style={{marginLeft:6,fontWeight:700}}>{openSection==='options'?'−':'+'}</span>
        </div>
        {openSection==='options' && <>
        <div className="filters-actions-center">
          <button type="button" className={`btn filter-btn${showOnlyFavorites ? ' active' : ''}`} onClick={()=>setShowOnlyFavorites(f=>!f)} aria-pressed={showOnlyFavorites} aria-label="Filtrer favoris">
            {showOnlyFavorites ? '★ Favoris' : '☆ Favoris'}
          </button>
          <button type="button" className="btn filter-btn" onClick={() => { setQuery(''); setSortBy('rating'); setNearbyOnly(true); setDistanceAsc(true); setOnlyAvailable(false); setPage(1); setSelectedSkills([]); setMinRating(0); setMaxDistance(0); }} aria-label="Réinitialiser les filtres">
            ↺ Réinitialiser
            {(selectedSkills.length || minRating > 0 || maxDistance > 0 || showOnlyFavorites || !nearbyOnly || onlyAvailable || sortBy !== 'rating') ? (
              <span className="filter-badge">
                {[selectedSkills.length,minRating > 0 ? 1 : 0,maxDistance > 0 ? 1 : 0,showOnlyFavorites ? 1 : 0,!nearbyOnly ? 1 : 0,onlyAvailable ? 1 : 0,sortBy !== 'rating' ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            ) : null}
          </button>
          <button type="button" className={`btn filter-btn${compactView ? ' active' : ''}`} onClick={()=>setCompactView(v=>!v)} aria-pressed={compactView} aria-label="Vue compacte">
            {compactView ? '☰ Compact' : '☷ Étendu'}
          </button>
        </div>
        <div className="filters-toggles-row">
          <label className="toggle">
            <input type="checkbox" checked={nearbyOnly} onChange={e => { setNearbyOnly(e.target.checked); setPage(1); }} />
            <span>À proximité</span>
          </label>
          <label className="toggle">
            <input type="checkbox" checked={onlyAvailable} onChange={e => { setOnlyAvailable(e.target.checked); setPage(1); }} />
            <span>Disponibles</span>
          </label>
        </div>
        <div className="filters-sort-row">
          <label htmlFor="sortBy" className="filter-label">Trier par</label>
          <select id="sortBy" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }} className="filter-select" aria-label="Trier">
            <option value="rating">Note ↓</option>
            <option value="availability">Disponibilité</option>
            {nearbyOnly ? <option value="distance">Distance</option> : null}
            <option value="slot">Prochain créneau</option>
            <option value="name">Nom A→Z</option>
          </select>
          {(nearbyOnly && sortBy === 'distance') ? (
            <label className="toggle" style={{marginLeft:10}}>
              <input type="checkbox" checked={distanceAsc} onChange={e => { setDistanceAsc(e.target.checked); setPage(1); }} />
              <span>Distance ↑</span>
            </label>
          ) : null}
        </div>
        </>}
      </div>
      <div className="filters-footer">
        <span className="results-count" aria-live="polite">{filtered.length} résultat{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

export default FiltersPanel;
