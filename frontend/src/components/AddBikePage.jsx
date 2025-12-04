import React, { useState, useEffect, useRef } from 'react';
import { bikeService } from '../services/api';
import { useToast } from '../context/ToastContext';
import BikeCanvas from './BikeCanvas';
import PartPopover from './PartPopover';
import SummaryCard from './SummaryCard';
import BikeDetailView from './BikeDetailView';
import IdentificationGuide from './IdentificationGuide';
import '../styles/AddBikePage.css';

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
  frame_colors: COLOR_PALETTE.map(c=>c.name),
  wheels: ['Route','VTT','Urbain'],
  wheel_sizes: ['700C','29"','27.5"','650B','26"'],
  handlebar: ['Plat','Relevé','Drop'],
  saddle: ['Confort', 'Sport', 'Gel'],
  pedals: ['Standard','Automatiques','Personnalisées'],
  transmission: ['Mono','Double'],
  brakes: ['Patins','Disque']
};

export default function AddBikePage({ onClose, bike, conversational = false, startEditing = false }) {
  const { addToast } = useToast();
  const [brands, setBrands] = useState(['Trek','Giant','Specialized']);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [selectedPart, setSelectedPart] = useState(null);
  const [partOptions, setPartOptions] = useState(DEFAULT_PART_OPTIONS);
  const [config, setConfig] = useState({});
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [editing, setEditing] = useState(startEditing || !bike);
  const [currentBike, setCurrentBike] = useState(bike || null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const summaryRef = useRef(null);
  // Typeahead state and logic for brand suggestions
  const [serverBrands, setServerBrands] = useState([]);
  const [showBrandList, setShowBrandList] = useState(false);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [brandIndex, setBrandIndex] = useState(-1);

  // Typeahead state and logic for model suggestions
  const [serverModels, setServerModels] = useState([]);
  const [showModelList, setShowModelList] = useState(false);
  const [modelSuggestions, setModelSuggestions] = useState([]);
  const [modelIndex, setModelIndex] = useState(-1);

  useEffect(() => {
    // Prefill when opening existing bike in details mode
    if (bike) {
      const name = bike.name || '';
      const firstSpace = name.indexOf(' ');
      const parsedBrand = firstSpace > 0 ? name.substring(0, firstSpace) : name;
      const parsedModel = firstSpace > 0 ? name.substring(firstSpace + 1).trim() : '';
      const initialBrand = bike.brand || parsedBrand;
      const initialModel = bike.model || parsedModel;
      setBrand(initialBrand);
      setModel(initialModel);
      setConfig(prev => ({
        ...prev,
        type: bike.type || prev.type,
        frame_size: bike.frame_size || prev.frame_size,
        wheel_size: bike.wheel_size || prev.wheel_size,
        colors: Array.isArray(bike.colors) ? bike.colors : prev.colors,
        year: bike.year || prev.year,
        serial_number: bike.serial_number || prev.serial_number
      }));
      setCurrentBike(bike);
    }
  }, [bike]);

  useEffect(() => {
    const q = (brand || '').trim().toLowerCase();
    const source = serverBrands.length ? serverBrands : ['Trek','Specialized','Giant','Cannondale','Decathlon'];
    const sugg = q ? source.filter(b => b.toLowerCase().includes(q)).slice(0, 6) : [];
    setBrandSuggestions(sugg);
    setBrandIndex(-1);
    const show = showBrandList && sugg.length > 0;
    try {
      const inputEl = document.getElementById('brand-ta');
      if (inputEl) inputEl.setAttribute('aria-expanded', show ? 'true' : 'false');
      const listEl = document.getElementById('brand-ta-list');
      if (listEl) listEl.style.display = show ? 'block' : 'none';
    } catch {}
  }, [brand, showBrandList, serverBrands]);

  useEffect(() => {
    let cancelled = false;
    bikeService.getBrands().then(list => {
      if (!cancelled && Array.isArray(list)) setServerBrands(list);
    }).catch(() => {
      /* graceful fallback already handled */
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!brand || !brand.trim()) {
      setServerModels([]);
      return;
    }
    let cancelled = false;
    bikeService.getModels(brand).then(list => {
      if (!cancelled && Array.isArray(list)) setServerModels(list);
    }).catch(() => {
      setServerModels([]);
    });
    return () => { cancelled = true; };
  }, [brand]);

  useEffect(() => {
    const onDoc = (e) => {
      const wrap = document.getElementById('brand-ta-wrap');
      if (!wrap) return;
      if (!wrap.contains(e.target)) setShowBrandList(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    const q = (model || '').trim().toLowerCase();
    const source = serverModels.length ? serverModels : [];
    const sugg = q ? source.filter(m => m.toLowerCase().includes(q)).slice(0, 6) : [];
    setModelSuggestions(sugg);
    setModelIndex(-1);
    const show = showModelList && sugg.length > 0;
    try {
      const inputEl = document.getElementById('model-ta');
      if (inputEl) inputEl.setAttribute('aria-expanded', show ? 'true' : 'false');
      const listEl = document.getElementById('model-ta-list');
      if (listEl) listEl.style.display = show ? 'block' : 'none';
    } catch {}
  }, [model, showModelList, serverModels]);

  useEffect(() => {
    const onDoc = (e) => {
      const wrap = document.getElementById('model-ta-wrap');
      if (!wrap) return;
      if (!wrap.contains(e.target)) setShowModelList(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const handleBrandKey = (e) => {
    if (!showBrandList || brandSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setBrandIndex(i => Math.min((i < 0 ? 0 : i + 1), brandSuggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setBrandIndex(i => Math.max((i <= 0 ? 0 : i - 1), 0)); }
    else if (e.key === 'Enter') { if (brandIndex >= 0) { e.preventDefault(); setBrand(brandSuggestions[brandIndex]); setShowBrandList(false); } }
    else if (e.key === 'Escape') { setShowBrandList(false); }
  };

  const handleModelKey = (e) => {
    if (!showModelList || modelSuggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setModelIndex(i => Math.min((i < 0 ? 0 : i + 1), modelSuggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setModelIndex(i => Math.max((i <= 0 ? 0 : i - 1), 0)); }
    else if (e.key === 'Enter') { if (modelIndex >= 0) { e.preventDefault(); setModel(modelSuggestions[modelIndex]); setShowModelList(false); } }
    else if (e.key === 'Escape') { setShowModelList(false); }
  };

  useEffect(() => { if (successMsg && summaryRef.current) summaryRef.current.focus(); }, [successMsg]);

  const handlePartClick = (part) => {
    if (bike && !editing) return; // read-only view: ignore part clicks
    setSelectedPart(prev => prev === part ? null : part);
  };

  const handleSelect = (part, value) => {
    // map selection into config
    setConfig(prev => {
      const next = { ...prev };
      if (part === 'frame' || part === 'frame_sizes') next.frame_size = value;
        else if (part === 'frame_colors') {
          const current = Array.isArray(prev.colors) ? prev.colors : [];
          if (current.includes(value)) {
            next.colors = current.filter(c => c !== value);
          } else {
            const candidate = [...current, value];
            // Limit to last 3 selections for readability
            next.colors = candidate.length > 3 ? candidate.slice(candidate.length - 3) : candidate;
          }
        }
      else if (part === 'wheels') next.type = value;
      else if (part === 'wheel_sizes') next.wheel_size = value;
      else if (part === 'handlebar') next.handlebar = value;
      else if (part === 'saddle') next.saddle = value;
      else if (part === 'pedals') next.pedals = value;
      else if (part === 'transmission') next.transmission = value;
      else if (part === 'brakes') next.brakes = value;
      return next;
    });
  };

  const handleAddOption = (part, text) => {
    const key = part === 'frame' ? 'frame_sizes' : (part === 'frame_colors' ? 'frame_colors' : part);
    setPartOptions(prev => ({ ...prev, [key]: [...(prev[key]||[]), text] }));
  };

  const handleSave = async (e) => {
    e && e.preventDefault();
    setErrorMsg('');
    if (!brand || !model) { setErrorMsg('Marque et modèle obligatoires'); return; }
    if (!config.frame_size || (!config.type && !conversational)) { setErrorMsg(conversational ? 'Taille de cadre obligatoire' : 'Sélectionnez au moins la taille du cadre et le type de roues'); return; }
    setSaving(true);
    try {
      const name = `${brand} ${model}`.trim();
      if (bike) {
        const payload = { name, brand, model, type: config.type, frame_size: config.frame_size, notes: config.notes, wheel_size: config.wheel_size, year: config.year ? Number(config.year) : undefined, serial_number: config.serial_number, colors: Array.isArray(config.colors) ? config.colors : undefined };
        const updated = await bikeService.updateBike(bike.id, payload);
        // Determine unknown attributes for tech confidence update
        const unknowns = [];
        const UNKNOWN = '__UNKNOWN__';
        if (brand === UNKNOWN) unknowns.push('brand');
        if (model === UNKNOWN) unknowns.push('model');
        if (Array.isArray(config.colors) && config.colors.includes(UNKNOWN)) unknowns.push('colors');
        if (config.frame_size === UNKNOWN) unknowns.push('frame_size');
        let techUpdated = updated;
        if (unknowns.length) {
          try {
            techUpdated = await bikeService.updateBikeTech(bike.id, {
              brand: brand === UNKNOWN ? null : brand,
              model: model === UNKNOWN ? null : model,
              frame_size: config.frame_size === UNKNOWN ? null : config.frame_size,
              wheel_size: config.wheel_size,
              colors: Array.isArray(config.colors) ? config.colors.filter(c => c !== UNKNOWN) : []
            }, unknowns);
          } catch (err) { /* silent fail */ }
        }
        setSuccessMsg('Modifications enregistrées.');
        setErrorMsg('');
        setConfig(prev => ({ ...prev, ...techUpdated }));
        setEditing(false);
        if (typeof onClose === 'function') onClose();
      } else {
        const payload = { name, brand, model, ...config };
        const created = await bikeService.createBike(payload);
        try { if (brand) await bikeService.addBrand(brand); } catch {}
        try { if (brand && model) await bikeService.addModel(brand, model); } catch {}
        try { if (config.wheel_size) await bikeService.addWheelSize(config.wheel_size); } catch {}
        setSuccessMsg('Votre vélo a été enregistré avec succès.');
        setErrorMsg('');
        // After creation, update tech/confidence if unknowns present
        const unknowns = [];
        const UNKNOWN = '__UNKNOWN__';
        if (brand === UNKNOWN) unknowns.push('brand');
        if (model === UNKNOWN) unknowns.push('model');
        if (Array.isArray(config.colors) && config.colors.includes(UNKNOWN)) unknowns.push('colors');
        if (config.frame_size === UNKNOWN) unknowns.push('frame_size');
        let enriched = created;
        if (created?.id && unknowns.length) {
          try {
            enriched = await bikeService.updateBikeTech(created.id, {
              brand: brand === UNKNOWN ? null : brand,
              model: model === UNKNOWN ? null : model,
              frame_size: config.frame_size === UNKNOWN ? null : config.frame_size,
              wheel_size: config.wheel_size,
              colors: Array.isArray(config.colors) ? config.colors.filter(c => c !== UNKNOWN) : []
            }, unknowns);
          } catch (err) { /* ignore tech update errors */ }
        }
        setConfig(enriched || created || payload);
        if (typeof onClose === 'function') onClose();
      }
    } catch (err) {
      console.error(err);
      const status = err?.response?.status;
      const code = err?.response?.data?.error;
      if (status === 409 && code === 'duplicate_serial') {
        setErrorMsg('N° de série déjà utilisé pour votre compte');
        setSaving(false);
        return;
      }
      if (bike && status === 404) {
        addToast('Vélo introuvable ou supprimé.', 'warning');
        if (typeof onClose === 'function') onClose();
        return;
      }
      setErrorMsg('Erreur lors de l\'enregistrement');
    } finally { setSaving(false); }
  };

  // Load shared wheel sizes suggestions
  useEffect(() => {
    let cancelled = false;
    bikeService.getWheelSizes().then(list => {
      if (!cancelled && Array.isArray(list) && list.length) {
        setPartOptions(prev => ({ ...prev, wheel_sizes: Array.from(new Set([...(prev.wheel_sizes||[]), ...list])) }));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Autosave in edit mode for main fields (brand, model, config)
  useEffect(() => {
    if (!bike || !editing) return;
    const debounce = setTimeout(async () => {
      try {
        setIsAutoSaving(true);
        const name = `${brand || ''} ${model || ''}`.trim();
        const payload = {
          name,
          brand,
          model,
          type: config.type,
          frame_size: config.frame_size,
          notes: config.notes,
          wheel_size: config.wheel_size,
          year: config.year ? Number(config.year) : undefined,
          serial_number: config.serial_number,
          colors: Array.isArray(config.colors) ? config.colors : undefined
        };
        await bikeService.updateBike(bike.id, payload);
      } catch (e) { /* ignore autosave errors */ }
      finally {
        setIsAutoSaving(false);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1500);
      }
    }, 600);
    return () => clearTimeout(debounce);
  }, [bike, editing, brand, model, config.type, config.frame_size, config.wheel_size, config.year, config.serial_number, config.colors, config.notes]);

  // Conversation mode state machine
  const [step, setStep] = useState(0); // 0 brand, 1 model, 2 colors, 3 frame_size, 4 summary
  const UNKNOWN = '__UNKNOWN__';
  const stepsCount = 5;
  const [showGuide, setShowGuide] = useState(false);
  const goNext = () => {
    // validation per step
    if (step === 0 && !brand.trim() && brand !== UNKNOWN) { setErrorMsg('Veuillez saisir une marque ou choisir "Je ne sais pas"'); return; }
    if (step === 1 && !model.trim() && model !== UNKNOWN) { setErrorMsg('Veuillez saisir un modèle ou choisir "Je ne sais pas"'); return; }
    if (step === 2 && (!Array.isArray(config.colors) || config.colors.length === 0) && !(Array.isArray(config.colors) && config.colors.includes(UNKNOWN))) { setErrorMsg('Sélectionnez une couleur ou "Je ne sais pas"'); return; }
    if (step === 3 && !config.frame_size && config.frame_size !== UNKNOWN) { setErrorMsg('Sélectionnez une taille ou "Je ne sais pas"'); return; }
    setErrorMsg('');
    setStep(s => Math.min(s + 1, stepsCount - 1));
  };
  const goPrev = () => { setErrorMsg(''); setStep(s => Math.max(s - 1, 0)); };
  const restart = () => { setBrand(''); setModel(''); setConfig(prev => ({ ...prev, colors: [], frame_size: '' })); setStep(0); setErrorMsg(''); setSuccessMsg(''); };

  const conversationContent = conversational && !bike ? (
    <div className="conversation-wrap">
      {step === 0 && (
        <div className="bubble">
          <p><strong>Question:</strong> Quelle est la marque de votre vélo ?</p>
          <div className="input-col" style={{ marginTop: 8 }}>
            <label htmlFor="brand-ta-conv" className="sr-only">Marque</label>
            <input id="brand-ta-conv" list="brands-conv" value={brand} placeholder="ex: Trek" onChange={e => setBrand(e.target.value)} />
            <datalist id="brands-conv">
              {(["Trek","Specialized","Giant","Cannondale","Decathlon",...serverBrands]).filter((v,i,self)=>self.indexOf(v)===i).slice(0,20).map(b => (<option key={b} value={b} />))}
            </datalist>
            <div className="suggestions-row" style={{ marginTop: 8 }}>
              <button type="button" className={`suggestion-chip ${brand===UNKNOWN ? 'selected' : ''}`} onClick={() => setBrand(UNKNOWN)}>Je ne sais pas</button>
            </div>
          </div>
        </div>
      )}
      {step === 1 && (
        <div className="bubble">
          <p><strong>Question:</strong> Quel est le modèle ?</p>
          <input list="models-conv" value={model===UNKNOWN? '' : model} placeholder="ex: Domane" onChange={e => setModel(e.target.value)} />
          <datalist id="models-conv">
            {(serverModels||[]).slice(0,20).map(m => (<option key={m} value={m} />))}
          </datalist>
          <div className="suggestions-row" style={{ marginTop: 8 }}>
            <button type="button" className={`suggestion-chip ${model===UNKNOWN ? 'selected' : ''}`} onClick={() => setModel(UNKNOWN)}>Je ne sais pas</button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="bubble">
          <p><strong>Question:</strong> Choisissez une ou plusieurs couleurs.</p>
          <div className="suggestions-row" style={{ marginTop: 8 }}>
            {COLOR_PALETTE.map(c => (
              <button key={c.name} type="button" className={`suggestion-chip ${Array.isArray(config.colors) && config.colors.includes(c.name) ? 'selected' : ''}`} onClick={() => handleSelect('frame_colors', c.name)}>{c.name}</button>
            ))}
            <button type="button" className={`suggestion-chip ${Array.isArray(config.colors) && config.colors.includes(UNKNOWN) ? 'selected' : ''}`} onClick={() => {
              setConfig(prev => {
                const current = Array.isArray(prev.colors) ? prev.colors : [];
                // toggle unknown and clear others when unknown selected
                if (current.includes(UNKNOWN)) {
                  return { ...prev, colors: [] };
                }
                return { ...prev, colors: [UNKNOWN] };
              });
            }}>Je ne sais pas</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="bubble">
          <p><strong>Question:</strong> Quelle est la taille du cadre ?</p>
          <div className="suggestions-row" style={{ marginTop: 8 }}>
            {(partOptions.frame_sizes||[]).map(sz => (
              <button key={sz} type="button" className={`suggestion-chip ${config.frame_size===sz ? 'selected' : ''}`} onClick={() => handleSelect('frame_sizes', sz)}>{sz}</button>
            ))}
            <button type="button" className={`suggestion-chip ${config.frame_size===UNKNOWN ? 'selected' : ''}`} onClick={() => setConfig(prev => ({ ...prev, frame_size: prev.frame_size===UNKNOWN ? '' : UNKNOWN }))}>Je ne sais pas</button>
          </div>
          <div className="input-col" style={{ marginTop: 8 }}>
            <label htmlFor="frame-size-conv" className="sr-only">Taille du cadre</label>
            <input id="frame-size-conv" list="frame-sizes-conv" value={config.frame_size || ''} placeholder="ex: M / L / 54" onChange={e => setConfig(prev => ({ ...prev, frame_size: e.target.value }))} />
            <datalist id="frame-sizes-conv">
              {(partOptions.frame_sizes||['S','M','L','XL']).map(sz => (<option key={sz} value={sz} />))}
            </datalist>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="bubble summary">
          <p><strong>Résumé:</strong></p>
          <ul>
            <li>Marque: {brand === UNKNOWN ? 'Inconnue' : (brand || '—')}</li>
            <li>Modèle: {model === UNKNOWN ? 'Inconnu' : (model || '—')}</li>
            <li>Couleurs: {Array.isArray(config.colors) && config.colors.includes(UNKNOWN) ? 'Inconnues' : ((config.colors||[]).join(', ') || '—')}</li>
            <li>Taille cadre: {config.frame_size === UNKNOWN ? 'Inconnue' : (config.frame_size || '—')}</li>
          </ul>
          <p style={{ marginTop: 8 }}>Confirmer l'enregistrement ?</p>
          {(brand===UNKNOWN || model===UNKNOWN || (Array.isArray(config.colors)&&config.colors.includes(UNKNOWN)) || config.frame_size===UNKNOWN) && (
            <div className="unknown-hint" style={{marginTop:12}}>
              <p style={{fontSize:'0.85rem', color:'#475569'}}>Certaines informations sont inconnues. Utilisez le guide pour les identifier.</p>
              <button type="button" className="btn tertiary" onClick={() => setShowGuide(true)}>Ouvrir le guide d'identification</button>
            </div>
          )}
        </div>
      )}
      {errorMsg && <div className="error-msg" style={{ marginTop: 8 }}>{errorMsg}</div>}
      {successMsg && <div className="success-msg" style={{ marginTop: 8 }}>{successMsg}</div>}
      <div className="controls" style={{ marginTop: 12 }}>
        {step > 0 && step < 4 && (
          <button type="button" className="btn secondary" onClick={goPrev}>Précédent</button>
        )}
        {step < 4 && (
          <button type="button" className="btn primary" onClick={goNext}>Suivant</button>
        )}
        {step === 4 && (
          <>
            <button type="button" className="btn secondary" onClick={restart}>Réinitialiser</button>
            <button type="button" className="btn primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Confirmer'}</button>
            <button type="button" className="btn" onClick={onClose}>Fermer</button>
          </>
        )}
      </div>
      {showGuide && (
        <IdentificationGuide
          unknown={{
            brand: brand===UNKNOWN,
            model: model===UNKNOWN,
            colors: Array.isArray(config.colors)&&config.colors.includes(UNKNOWN),
            frame_size: config.frame_size===UNKNOWN,
            type: !config.type
          }}
            onClose={() => setShowGuide(false)}
        />
      )}
    </div>
  ) : null;

  return (
    <div className={`add-bike-page ${conversational && !bike ? 'conversation-mode' : ''}`}>
      {conversationContent || (
      <>
      <div className="top-close" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div className="save-indicator" aria-live="polite" style={{color:'#6b7280'}}>
          {(bike && editing && isAutoSaving) ? 'Enregistrement…' : (bike && editing && justSaved ? 'Enregistré ✓' : '')}
        </div>
        <button className="btn secondary" onClick={onClose}>Fermer</button>
      </div>
      <header className="page-header">
        <h2>{bike ? (editing ? 'Éditer le vélo' : 'Détails du vélo') : 'Ajouter un vélo'}</h2>
        <p className="subtitle">Configurez votre vélo en cliquant sur les parties.</p>
      </header>

      <section className="top-bar">
        <div className="input-row">
          <div className="input-col">
            <label htmlFor="brand-ta">Marque</label>
            {/* Typeahead léger pour la marque */}
            <div className="typeahead" id="brand-ta-wrap">
              <input
                id="brand-ta"
                name="brand"
                placeholder="Saisir une marque…"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="brand-ta-list"
                value={brand}
                onChange={e => setBrand(e.target.value)}
                onFocus={() => setShowBrandList(true)}
                onBlur={() => setTimeout(() => setShowBrandList(false), 120)}
                onKeyDown={handleBrandKey}
                disabled={bike && !editing}
              />
              <div id="brand-ta-list" className="typeahead-list" role="listbox" aria-label="Suggestions de marques">
                {brandSuggestions.map((b, i) => (
                  <button
                    key={b}
                    type="button"
                    className="typeahead-item"
                    role="option"
                    aria-selected={i === brandIndex ? 'true' : 'false'}
                    onMouseDown={(e) => { e.preventDefault(); setBrand(b); setShowBrandList(false); }}
                  >{b}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="input-col">
            <label>Modèle</label>
            <div className="typeahead" id="model-ta-wrap">
              <input
                id="model-ta"
                name="model"
                placeholder="Saisir un modèle…"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded="false"
                aria-controls="model-ta-list"
                value={model}
                onChange={e => setModel(e.target.value)}
                onFocus={() => setShowModelList(true)}
                onBlur={() => setTimeout(() => setShowModelList(false), 120)}
                onKeyDown={handleModelKey}
                disabled={bike && !editing}
              />
              <div id="model-ta-list" className="typeahead-list" role="listbox" aria-label="Suggestions de modèles">
                {modelSuggestions.map((m, i) => (
                  <button
                    key={m}
                    type="button"
                    className="typeahead-item"
                    role="option"
                    aria-selected={i === modelIndex ? 'true' : 'false'}
                    onMouseDown={(e) => { e.preventDefault(); setModel(m); setShowModelList(false); }}
                  >{m}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="input-row" style={{ marginTop: 8 }}>
          <div className="input-col">
            <label>Année</label>
            <input
              list="years-main"
              type="number"
              placeholder="ex: 2023"
              value={config.year || ''}
              onChange={e => setConfig(prev => ({ ...prev, year: e.target.value }))}
              disabled={bike && !editing}
            />
            <datalist id="years-main">
              {Array.from({ length: 40 }, (_, i) => new Date().getFullYear() - i).map(y => (<option key={y} value={y} />))}
            </datalist>
          </div>
          <div className="input-col">
            <label>Numéro de série</label>
            <input
              type="text"
              placeholder="ex: SN12345ABC"
              value={config.serial_number || ''}
              onChange={e => setConfig(prev => ({ ...prev, serial_number: e.target.value }))}
              disabled={bike && !editing}
            />
          </div>
        </div>

        {/* Suggestions pour taille de cadre, taille de roue et couleurs principales */}
        {(!bike || editing) && (
          <div className="input-row" style={{ marginTop: 12 }}>
              <div className="input-col">
                <label>Type de vélo</label>
                <div className="suggestions-row">
                  {(partOptions.wheels||[]).map(opt => (
                    <button key={opt} type="button" className={`suggestion-chip ${config.type===opt ? 'selected' : ''}`} onClick={() => handleSelect('wheels', opt)}>{opt}</button>
                  ))}
                </div>
              </div>
            <div className="input-col">
              <label>Tailles de cadre</label>
              <div className="suggestions-row">
                {(partOptions.frame_sizes||[]).map(opt => (
                  <button key={opt} type="button" className={`suggestion-chip ${config.frame_size===opt ? 'selected' : ''}`} onClick={() => handleSelect('frame_sizes', opt)}>{opt}</button>
                ))}
              </div>
            </div>
            <div className="input-col">
              <label>Tailles de roues</label>
              <div className="suggestions-row">
                {(partOptions.wheel_sizes||[]).map(opt => (
                  <button key={opt} type="button" className={`suggestion-chip ${config.wheel_size===opt ? 'selected' : ''}`} onClick={() => handleSelect('wheel_sizes', opt)}>{opt}</button>
                ))}
              </div>
              <input
                list="wheel-sizes-main"
                placeholder="ex: 700C / 29"
                value={config.wheel_size || ''}
                onChange={e => setConfig(prev => ({ ...prev, wheel_size: e.target.value }))}
                disabled={bike && !editing}
                style={{ marginTop: 4 }}
              />
              <datalist id="wheel-sizes-main">
                {(partOptions.wheel_sizes||['700C','29"','27.5"','650B','26"','24"','20"']).map(sz => (<option key={sz} value={sz} />))}
              </datalist>
            </div>
          </div>
        )}
      </section>

      <section className="center-canvas">
      {/* Représentation du vélo supprimée selon demande */}
      </section>

      <footer className="bottom-bar">
        <div className="summary-wrap">
          {/* SummaryCard retirée */}
          {/* Suggestions de couleurs courantes */}
          {(!bike || editing) && (
            <div style={{ marginTop: 8 }}>
              <div className="suggestions-row">
                {COLOR_PALETTE.map(c => (
                  <button
                    key={c.name}
                    type="button"
                    className={`suggestion-chip ${Array.isArray(config.colors) && config.colors.includes(c.name) ? 'selected' : ''}`}
                    onClick={() => handleSelect('frame_colors', c.name)}
                    disabled={bike && !editing}
                  >{c.name}</button>
                ))}
              </div>
            </div>
          )}
          {/* Détails & composants visibles en mode lecture; en édition on affiche une zone composants avec ajout */}
          {bike && !editing && (
            <div style={{ marginTop: 12 }}>
              <BikeDetailView bike={bike} />
            </div>
          )}
          {bike && editing && (
            <div style={{ marginTop: 12 }}>
              <section className="components-area" aria-live="polite">
                <header className="components-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <h3 style={{margin:0}}>Composants du vélo</h3>
                  <AddComponentInline bikeId={bike.id} onAdded={async () => {
                    try {
                      const fresh = await bikeService.getBike(bike.id);
                      setCurrentBike(fresh);
                    } catch {}
                  }} />
                </header>
                <BikeDetailView bike={currentBike || bike} showSummary={false} showHeader={false} />
              </section>
            </div>
          )}
          {errorMsg && <div className="error-msg">{errorMsg}</div>}
          {successMsg && <div className="success-msg" role="status" aria-live="polite" ref={summaryRef}>{successMsg}</div>}
        </div>
        <div className="actions">
          {bike ? (
            editing ? (
              <>
                {/* Autosave enabled: no bottom close button; use top-right Fermer */}
              </>
            ) : (
              <>
                <button className="btn" onClick={() => setEditing(true)}>Modifier</button>
                {/* No bottom close button in read-only; use top-right Fermer */}
              </>
            )
          ) : (
            <>
              <button className="btn secondary" onClick={onClose}>Annuler</button>
              <button className="btn primary" onClick={handleSave} disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </>
          )}
        </div>
      </footer>
      </>
      )}
    </div>
  );
}

function AddComponentInline({ bikeId, onAdded }) {
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const submit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await bikeService.createComponent(bikeId, { name, type });
      setName(''); setType(''); setOpen(false);
      if (typeof onAdded === 'function') onAdded();
    } catch (e) { /* noop */ }
    finally { setSaving(false); }
  };
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>Ajouter un composant</button>;
  return (
    <div style={{display:'flex',gap:8,alignItems:'center'}}>
      <input placeholder="Nom" value={name} onChange={e=>setName(e.target.value)} />
      <input placeholder="Type" value={type} onChange={e=>setType(e.target.value)} />
      <button className="btn primary" onClick={submit} disabled={saving}>{saving ? 'Ajout...' : 'Ajouter'}</button>
      <button className="btn secondary" onClick={() => { setOpen(false); setName(''); setType(''); }}>Annuler</button>
    </div>
  );
}
