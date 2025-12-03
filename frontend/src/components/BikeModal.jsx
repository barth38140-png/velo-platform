import React, { useEffect, useState } from 'react';
import { bikeService } from '../services/api';
import '../styles/BikeModal.css';
import BikeSVG from './BikeSVG';

const DEFAULT_BRANDS = ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Decathlon'];
const DEFAULT_MODELS = {
  Trek: ['Domane', 'Emonda', 'Marlin'],
  Specialized: ['Allez', 'Rockhopper', 'Sirrus'],
  Giant: ['Defy', 'Talon', 'Escape'],
  Cannondale: ['Synapse', 'Trail', 'Quick'],
  Decathlon: ['Triban', 'Rockrider', 'Elops'],
};

const BRAND_ICONS = {
  Trek: '🚴',
  Specialized: '⭐',
  Giant: '🦒',
  Cannondale: '⚙️',
  Decathlon: '🏷️',
};

const TYPE_ICONS = {
  Route: 'route',
  VTT: 'vtt',
  Urbain: 'urbain',
  Électrique: 'electrique',
};

const COLOR_PALETTE = [
  { name: 'Noir', hex: '#111827' },
  { name: 'Blanc', hex: '#F8FAFC' },
  { name: 'Rouge', hex: '#ef4444' },
  { name: 'Bleu', hex: '#3b82f6' },
  { name: 'Vert', hex: '#10b981' },
  { name: 'Jaune', hex: '#f59e0b' },
  { name: 'Orange', hex: '#fb923c' },
  { name: 'Violet', hex: '#8b5cf6' },
];

const DEFAULT_PART_OPTIONS = {
  frame_sizes: ['S','M','L','XL'],
  frame_colors: COLOR_PALETTE.map(c => c.name),
  wheels: ['Route','VTT','Urbain'],
  handlebar: ['Plat','Relevé','Drop'],
  saddle: ['Confort', 'Sport', 'Gel'],
  pedals: ['Standard','Automatiques','Personnalisées'],
};

function readStoredBrands() {
  try {
    const raw = localStorage.getItem('bike_brands');
    if (!raw) return DEFAULT_BRANDS.slice();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_BRANDS.slice();
    const merged = Array.from(new Set([...DEFAULT_BRANDS, ...parsed]));
    return merged;
  } catch (e) {
    return DEFAULT_BRANDS.slice();
  }
}

function readStoredModelsFor(brand) {
  try {
    const key = `bike_models_${brand}`;
    const raw = localStorage.getItem(key);
    const base = DEFAULT_MODELS[brand] || [];
    if (!raw) return base.slice();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return base.slice();
    return Array.from(new Set([...base, ...parsed]));
  } catch (e) {
    return DEFAULT_MODELS[brand] ? DEFAULT_MODELS[brand].slice() : [];
  }
}

function saveBrand(brand) {
  try {
    const cur = readStoredBrands();
    if (!cur.includes(brand)) {
      const next = [...cur, brand];
      localStorage.setItem('bike_brands', JSON.stringify(next));
    }
  } catch (e) { }
}

function saveModelFor(brand, model) {
  try {
    const key = `bike_models_${brand}`;
    const curRaw = localStorage.getItem(key);
    const cur = curRaw ? JSON.parse(curRaw) : [];
    if (!Array.isArray(cur)) return;
    if (!cur.includes(model)) {
      cur.push(model);
      localStorage.setItem(key, JSON.stringify(cur));
    }
  } catch (e) { }
}

export default function BikeModal({ bike, onClose }) {
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successBike, setSuccessBike] = useState(null);
  const summaryRef = React.useRef(null);

  const [brands, setBrands] = useState(() => readStoredBrands());
  const [selectedBrand, setSelectedBrand] = useState(bike?.brand || '');
  const [showOtherBrand, setShowOtherBrand] = useState(false);
  const [otherBrandText, setOtherBrandText] = useState('');

  const [models, setModels] = useState(() => []);
  const [selectedModel, setSelectedModel] = useState(bike?.model || '');
  const [showOtherModel, setShowOtherModel] = useState(false);
  const [otherModelText, setOtherModelText] = useState('');

  const [type, setType] = useState(bike?.type || '');
  const [frameSize, setFrameSize] = useState(bike?.frame_size || '');
  const [color, setColor] = useState(bike?.color || '');
  // allow multiple colors
  const [colorsSelected, setColorsSelected] = useState(bike?.colors || (bike?.color ? [bike.color] : []));
  const [handlebar, setHandlebar] = useState(bike?.handlebar || '');
  const [saddle, setSaddle] = useState(bike?.saddle || '');
  const [pedals, setPedals] = useState(bike?.pedals || '');
  const [selectedPart, setSelectedPart] = useState(null);
  const [partNewText, setPartNewText] = useState('');
  const [partOptions, setPartOptions] = useState({});
  const [purchaseDate, setPurchaseDate] = useState(bike?.purchase_date || '');
  const [notes, setNotes] = useState(bike?.notes || '');

  useEffect(() => {
    setBrands(readStoredBrands());
  }, []);

  useEffect(() => {
    // load stored part options
    const parts = {
      frame_sizes: readStoredPartOptions('frame_sizes', DEFAULT_PART_OPTIONS.frame_sizes),
      frame_colors: readStoredPartOptions('frame_colors', DEFAULT_PART_OPTIONS.frame_colors),
      wheels: readStoredPartOptions('wheels', DEFAULT_PART_OPTIONS.wheels),
      handlebar: readStoredPartOptions('handlebar', DEFAULT_PART_OPTIONS.handlebar),
      saddle: readStoredPartOptions('saddle', DEFAULT_PART_OPTIONS.saddle),
      pedals: readStoredPartOptions('pedals', DEFAULT_PART_OPTIONS.pedals),
    };
    setPartOptions(parts);
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      setModels(readStoredModelsFor(selectedBrand));
    } else {
      setModels([]);
    }
    setSelectedModel('');
  }, [selectedBrand]);

  useEffect(() => {
    if (bike) {
      setSelectedBrand(bike.brand || '');
      setSelectedModel(bike.model || '');
      setType(bike.type || '');
      setFrameSize(bike.frame_size || '');
      setColor(bike.color || '');
      setPurchaseDate(bike.purchase_date || '');
      setNotes(bike.notes || '');
    }
  }, [bike]);

  const addBrandAndSelect = (b) => {
    const name = b && b.toString().trim();
    if (!name) return;
    saveBrand(name);
    const next = readStoredBrands();
    setBrands(next);
    setSelectedBrand(name);
    setShowOtherBrand(false);
    setOtherBrandText('');
  };

  const addModelAndSelect = (m) => {
    const name = m && m.toString().trim();
    if (!name || !selectedBrand) return;
    saveModelFor(selectedBrand, name);
    setModels(readStoredModelsFor(selectedBrand));
    setSelectedModel(name);
    setShowOtherModel(false);
    setOtherModelText('');
  };

  function readStoredPartOptions(key, fallback) {
    try {
      const raw = localStorage.getItem(`bike_part_${key}`);
      if (!raw) return Array.isArray(fallback) ? fallback.slice() : fallback;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return Array.isArray(fallback) ? fallback.slice() : fallback;
      return Array.from(new Set([...fallback, ...parsed]));
    } catch (e) { return Array.isArray(fallback) ? fallback.slice() : fallback; }
  }

  function savePartOption(key, value) {
    try {
      const storageKey = `bike_part_${key}`;
      const curRaw = localStorage.getItem(storageKey);
      const cur = curRaw ? JSON.parse(curRaw) : [];
      if (!Array.isArray(cur)) return;
      if (!cur.includes(value)) {
        cur.push(value);
        localStorage.setItem(storageKey, JSON.stringify(cur));
      }
      setPartOptions(prev => ({ ...prev, [key]: readStoredPartOptions(key, DEFAULT_PART_OPTIONS[key]) }));
    } catch (e) { console.error('savePartOption', e); }
  }

  function togglePart(part) {
    setPartNewText('');
    setSelectedPart(prev => (prev === part ? null : part));
  }

  function selectPartOption(part, option) {
    if (part === 'frame_sizes') setFrameSize(option);
    if (part === 'frame_colors') {
      setColorsSelected(prev => prev.includes(option) ? prev.filter(x => x !== option) : [...prev, option]);
    }
    if (part === 'wheels') setType(option);
    if (part === 'handlebar') setHandlebar(option);
    if (part === 'saddle') setSaddle(option);
    if (part === 'pedals') setPedals(option);
  }

  const resetFormForNew = () => {
    setSelectedBrand('');
    setSelectedModel('');
    setType('');
    setFrameSize('');
    setColorsSelected([]);
    setPurchaseDate('');
    setNotes('');
    setSuccessBike(null);
    setSuccessMsg('');
    setErrorMsg('');
  };

  async function handleSave(e) {
    e && e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!selectedBrand) { setErrorMsg('Veuillez sélectionner une marque.'); return; }
    if (!selectedModel) { setErrorMsg('Veuillez sélectionner un modèle.'); return; }
    if (!type) { setErrorMsg('Veuillez sélectionner le type de vélo.'); return; }

    setSaving(true);
    try {
      // persist newly added brand/model before creating
      if (showOtherBrand && otherBrandText) addBrandAndSelect(otherBrandText);
      if (showOtherModel && otherModelText) addModelAndSelect(otherModelText);

      // generate default label if backend expects a name
      const nextIdRaw = localStorage.getItem('bike_next_id');
      const nextId = nextIdRaw ? parseInt(nextIdRaw, 10) : 1;
      const genName = `Vélo #${nextId}`;
      localStorage.setItem('bike_next_id', String(nextId + 1));
      const name = `${selectedBrand} ${selectedModel}`.trim() || genName;
      const payload = { name, brand: selectedBrand, model: selectedModel, type, frame_size: frameSize, colors: colorsSelected, purchase_date: purchaseDate, notes };
      const created = await bikeService.createBike(payload);
      setSuccessBike(created || payload);
      setSuccessMsg('Votre vélo a été enregistré avec succès.');
      setErrorMsg('');
      // keep modal open to show the summary; caller can close
    } catch (err) {
      console.error('BikeModal save', err);
      setErrorMsg('Erreur lors de l enregistrement');
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    if (successBike && summaryRef.current) {
      try { summaryRef.current.focus(); } catch (e) { }
    }
  }, [successBike]);

  const brandButtons = brands.map(b => (
    <button key={b} type="button" className={`issue-btn brand-btn brand-card ${selectedBrand === b ? 'active' : ''}`} onClick={() => { setSelectedBrand(b); setShowOtherBrand(false); }} title={b}>
      <div className="brand-card-inner">
        <span className="brand-icon">{BRAND_ICONS[b] || '🚲'}</span>
        <span className="brand-label">{b}</span>
      </div>
      {selectedBrand === b && <span className="selected-badge">✅</span>}
    </button>
  ));

  const modelButtons = (models || []).map(m => (
    <button key={m} type="button" className={`issue-btn model-card ${selectedModel === m ? 'active' : ''}`} onClick={() => { setSelectedModel(m); setShowOtherModel(false); }}>
      <div className="model-card-inner">{m}</div>
      {selectedModel === m && <span className="selected-badge">✅</span>}
    </button>
  ));
  // small icon helper (simple inline SVGs)
  const Icon = ({ name }) => {
    switch (name) {
      case 'route':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M3 13c4-2 8-2 12 0" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M3 17c4-2 8-2 12 0" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>;
      case 'vtt':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><circle cx="6" cy="17" r="3" stroke="#0f172a" strokeWidth="1.3"/><circle cx="18" cy="17" r="3" stroke="#0f172a" strokeWidth="1.3"/><path d="M6 17 L10 11 L14 11 L18 17" stroke="#0f172a" strokeWidth="1.3" strokeLinecap="round"/></svg>;
      case 'urbain':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><rect x="3" y="9" width="18" height="6" rx="3" stroke="#0f172a" strokeWidth="1.3"/></svg>;
      case 'electrique':
        return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden><path d="M13 2 L7 12h4l-1 8 6-10h-4l1-8z" stroke="#0f172a" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/></svg>;
      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <header className="modal-header">
          <h3>{bike ? 'Détails du vélo' : 'Ajouter un vélo'}</h3>
          <button className="close" onClick={onClose} aria-label="Fermer">✖</button>
        </header>
        <form onSubmit={handleSave} className="ajouter-velo-form modal-body">
          <div className="brand-model-row">
            <div className="brand-model-col">
              <label className="label">Marque *</label>
              <div className="brands-grid">
                {brandButtons}
                <button type="button" className={`issue-btn brand-add ${showOtherBrand ? 'active' : ''}`} onClick={() => setShowOtherBrand(s => !s)}>➕ Autre marque</button>
              </div>
              {showOtherBrand && (
                <div className="inline-add">
                  <input placeholder="Nouvelle marque" value={otherBrandText} onChange={e => setOtherBrandText(e.target.value)} />
                  <button type="button" className="btn" onClick={() => addBrandAndSelect(otherBrandText)}>Ajouter</button>
                </div>
              )}
            </div>
            <div className="brand-model-col">
              <label className="label">Modèle *</label>
              <div className="models-grid">
                {modelButtons}
                <button type="button" className={`issue-btn model-add ${showOtherModel ? 'active' : ''}`} onClick={() => setShowOtherModel(s => !s)}>➕ Autre modèle</button>
              </div>
              {showOtherModel && (
                <div className="inline-add">
                  <input placeholder="Nouveau modèle" value={otherModelText} onChange={e => setOtherModelText(e.target.value)} />
                  <button type="button" className="btn" onClick={() => addModelAndSelect(otherModelText)}>Ajouter</button>
                </div>
              )}
            </div>
          </div>

          <div className="immersive-grid">
            <div className="center-col">
              <div className="bike-image-wrap" style={{position:'relative'}}>
                <BikeSVG selectedPart={selectedPart} onPartClick={(p) => togglePart(p)} />

                {/* Part-specific contextual menu as overlay near the SVG */}
                {selectedPart && (
                  <div className="part-menu absolute" role="dialog" aria-label={`Options pour ${selectedPart}`}>
                    <div className="part-menu-header">Options: {selectedPart}</div>
                    <div className="part-menu-body">
                      <div className="options-grid">
                        {(selectedPart === 'frame' ? (partOptions.frame_sizes || []) : (partOptions[selectedPart] || []) ).map(opt => {
                          const isActive = (selectedPart === 'frame' && frameSize === opt) ||
                            (selectedPart === 'frame_colors' && colorsSelected.includes(opt)) ||
                            (selectedPart === 'wheels' && type === opt) ||
                            (selectedPart === 'handlebar' && handlebar === opt) ||
                            (selectedPart === 'saddle' && saddle === opt) ||
                            (selectedPart === 'pedals' && pedals === opt);
                          return (
                            <button key={opt} type="button" className={`issue-btn ${isActive ? 'active' : ''}`} onClick={() => selectPartOption(selectedPart === 'frame' ? 'frame_sizes' : selectedPart, opt)}>
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {selectedPart === 'frame' && (
                        <div className="frame-color-list" style={{marginTop:8}}>
                          <div className="label">Couleurs du cadre</div>
                          <div className="color-grid">
                            {(partOptions.frame_colors || []).map(c => {
                              const active = colorsSelected.includes(c);
                              const hex = (COLOR_PALETTE.find(p=>p.name===c)||{hex:'#ddd'}).hex;
                              return (
                                <button
                                  key={c}
                                  className={`issue-btn color-pill ${active ? 'active' : ''}`}
                                  onClick={() => selectPartOption('frame_colors', c)}
                                  aria-pressed={active}
                                  style={{ outline: active ? '2px solid #3b82f6' : 'none' }}
                                >
                                  <span className="color-swatch" style={{background: hex}} />
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <div className="add-option">
                        <input placeholder="➕ Autre option" value={partNewText} onChange={e => setPartNewText(e.target.value)} />
                        <button type="button" className="btn" onClick={() => {
                          const key = selectedPart === 'frame' ? 'frame_sizes' : (selectedPart === 'frame_colors' ? 'frame_colors' : selectedPart);
                          if (!partNewText) return;
                          savePartOption(key, partNewText);
                          setPartNewText('');
                        }}>Ajouter</button>
                      </div>
                    </div>
                    <div className="part-menu-footer">
                      <button className="btn secondary" type="button" onClick={() => setSelectedPart(null)}>Fermer</button>
                    </div>
                  </div>
                )}
              </div>

              <div className="colors-under">
                <label className="label">Couleurs (multi)</label>
                <div className="color-grid">
                  {COLOR_PALETTE.map(c => {
                    const active = colorsSelected.includes(c.name);
                    return (
                      <button
                        key={c.name}
                        type="button"
                        className={`issue-btn color-pill ${active ? 'active' : ''}`}
                        onClick={() => {
                          setColorsSelected(prev => prev.includes(c.name) ? prev.filter(x => x !== c.name) : [...prev, c.name]);
                        }}
                        aria-pressed={active}
                        style={{ outline: active ? '2px solid #3b82f6' : 'none' }}
                      >
                        <span className="color-swatch" style={{background:c.hex}} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="right-col">
              <div className="field-group">
                <label className="label">Type *</label>
                <div className="type-grid">
                  {['Route', 'VTT', 'Urbain', 'Électrique'].map(t => (
                    <button key={t} type="button" className={`issue-btn type-btn ${type === t ? 'active' : ''}`} onClick={() => setType(t)} aria-pressed={type === t}><span className="type-icon"><Icon name={TYPE_ICONS[t]} /></span><span>{t}</span></button>
                  ))}
                </div>

                <label className="label">Taille cadre</label>
                <div className="type-grid">
                  {['S', 'M', 'L', 'XL'].map(s => (
                    <button key={s} type="button" className={`issue-btn size-btn ${frameSize === s ? 'active' : ''}`} onClick={() => setFrameSize(s)} aria-pressed={frameSize === s}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live preview card reflecting current selections */}
          {/* Bloc preview retiré */}

          <div className="field-row">
            <label className="label">Date d'achat</label>
            <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} />
          </div>

          <div className="field-row">
            <label className="label">Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </div>

          {errorMsg && <div className="error-msg">{errorMsg}</div>}
          {successMsg && <div className="success-toast" role="status" aria-live="polite">{successMsg}</div>}

          {successBike && (
            <div className="summary-card" ref={summaryRef} tabIndex={-1}>
              <div className="summary-header">Votre vélo a été enregistré avec succès.</div>
              <div className="summary-body">
                <div className="summary-row"><strong>{successBike.name || `${successBike.brand} ${successBike.model}`}</strong></div>
                <div className="summary-row">Type: {successBike.type || type}</div>
                <div className="summary-row">Taille: {successBike.frame_size || frameSize}</div>
                <div className="summary-row">Couleurs: { (successBike.colors || colorsSelected || []).map((c, i) => (
                  <span key={i} className="mini-swatch" style={{background: (COLOR_PALETTE.find(p=>p.name===c)||{hex:'#ddd'}).hex}} title={c}></span>
                ))}</div>
                {successBike.purchase_date && <div className="summary-row">Achat: {successBike.purchase_date}</div>}
                {successBike.notes && <div className="summary-row">Notes: {successBike.notes}</div>}
              </div>
              <div className="summary-actions">
                <button className="btn primary" type="button" onClick={() => { onClose && onClose(); }}>Fermer</button>
                <button className="btn secondary" type="button" onClick={() => resetFormForNew()}>Ajouter un autre</button>
              </div>
            </div>
          )}

          <footer className="modal-footer">
            <button className="btn primary" type="submit" disabled={saving}>{saving ? 'Sauvegarde...' : '➕ Ajouter'}</button>
            <button className="btn secondary" type="button" onClick={onClose}>Annuler</button>
          </footer>
        </form>
      </div>
    </div>
  );
}
