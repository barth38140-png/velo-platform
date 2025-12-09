import React, { useEffect, useMemo, useRef, useState } from 'react';
import './BikeDetailView.css';
import { Icon } from '@iconify/react';
import { bikeService } from '../services/api';

function DetailRow({ label, value }) {
  const displayValue = value || 'Inconnu';
  return (
    <div className="detail-row">
      <div className="detail-label">{label}</div>
      <div className="detail-value" style={{ color: !value ? '#9ca3af' : undefined }}>{displayValue}</div>
    </div>
  );
}

function ComponentItem({ comp }) {
  return (
    <div className="component-item">
      <div className="component-main">
        <div className="component-name">{comp.name}</div>
        <div className="component-type">{comp.type || '—'}</div>
      </div>
      <div className="component-meta">
        <div className="meta-pill">
          <span className="meta-label">Usure</span>
          <span className="meta-value">{typeof comp.wear === 'number' ? `${comp.wear}%` : '—'}</span>
        </div>
        <div className="meta-pill">
          <span className="meta-label">Remplacé</span>
          <span className="meta-value">{comp.last_replaced_at ? new Date(comp.last_replaced_at).toLocaleDateString() : '—'}</span>
        </div>
      </div>
    </div>
  );
}

export default function BikeDetailView({ bike, editable = true, showSummary = true, showHeader = true }) {
  // IMPORTANT: All hooks must be called unconditionally
  
  const name = bike?.name || '';
  const firstSpace = name.indexOf(' ');
  const parsedBrand = firstSpace > 0 ? name.substring(0, firstSpace) : name;
  const parsedModel = firstSpace > 0 ? name.substring(firstSpace + 1).trim() : '';
  const brand = bike?.brand || parsedBrand;
  const model = bike?.model || parsedModel;

  const colors = Array.isArray(bike?.colors) ? bike.colors : [];
  const COLOR_OPTIONS = ['Noir','Blanc','Rouge','Bleu','Vert','Jaune','Orange','Violet'];
  const BRAND_OPTIONS = ['Peugeot','Giant','Cannondale','Decathlon','Specialized','Trek'];
  const TYPE_OPTIONS = ['Route','VTT','Urbain'];
  const FRAME_SIZE_OPTIONS = ['S','M','L','XL'];
  const WHEEL_SIZE_OPTIONS = ['700C','29"','27.5"','650B','26"','24"','20"'];
  const CURRENT_YEAR = new Date().getFullYear();

  // Editable local state - ALWAYS called
  const [form, setForm] = useState({
    brand: brand || '',
    model: model || '',
    type: bike?.type || '',
    frame_size: bike?.frame_size || '',
    wheel_size: bike?.wheel_size || '',
    year: bike?.year || '',
    serial_number: bike?.serial_number || '',
    colors: colors
  });

  // Correction exhaustive-deps : ajout des dépendances nécessaires
  useEffect(() => {
    setForm({
      brand: brand || '',
      model: model || '',
      type: bike?.type || '',
      frame_size: bike?.frame_size || '',
      wheel_size: bike?.wheel_size || '',
      year: bike?.year || '',
      serial_number: bike?.serial_number || '',
      colors: Array.isArray(bike?.colors) ? bike.colors : []
    });
  }, [bike?.id, brand, model, bike?.type, bike?.frame_size, bike?.wheel_size, bike?.year, bike?.serial_number, bike?.colors]);

  const pendingRef = useRef(false);
  const debounceRef = useRef();
  const [isSaving, setIsSaving] = useState(false);
  const payload = useMemo(() => ({
    name: `${form.brand || ''} ${form.model || ''}`.trim(),
    brand: form.brand || undefined,
    model: form.model || undefined,
    type: form.type || undefined,
    frame_size: form.frame_size || undefined,
    wheel_size: form.wheel_size || undefined,
    year: form.year ? Number(form.year) : undefined,
    serial_number: form.serial_number || undefined,
    colors: Array.isArray(form.colors) ? form.colors : undefined
  }), [form]);

  // Autosave when form changes (debounced)
  useEffect(() => {
    // Check condition INSIDE the effect, after all hooks are defined
    if (!editable) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingRef.current = true;
    setIsSaving(true);
    debounceRef.current = setTimeout(async () => {
      try {
        await bikeService.updateBike(bike.id, payload);
      } catch {
        // ignore errors for now; could show a toast
      } finally {
        pendingRef.current = false;
        setIsSaving(false);
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [payload, editable, bike.id]);

  const updateField = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  // Fonction inutilisée, suppression

  // Normalize raw component type strings to stable category keys
  function normalizeTypeToKey(t) {
    const s = String(t || '').toLowerCase();
    if (/\b(roue|wheel|tire|pneu|jante|rim|hub|moyeu)\b/.test(s)) return 'roues';
    if (/\b(frein|brake)\b/.test(s)) return 'freins';
    if (/(transmission|drivetrain|cassette|chaine|chaîne|chain|derail|dérailleur|plateau|crank|pédalier|pedalier|shifter|levier)/.test(s)) return 'transmission';
    if (/\b(selle|saddle|seat)\b/.test(s)) return 'selle';
    if (/(guidon|handlebar|bar|potence|stem|grip|poignee|poignée)/.test(s)) return 'guidon';
    return 'autres';
  }

  // Group components by normalized category key
  const groups = {};
  (Array.isArray(bike.components) ? bike.components : []).forEach(c => {
    const key = normalizeTypeToKey(c.type);
    if (!groups[key]) groups[key] = [];
    groups[key].push(c);
  });

  const labelByKey = {
    roues: 'Roues',
    freins: 'Freins',
    transmission: 'Transmission',
    selle: 'Selle',
    guidon: 'Guidon',
    autres: 'Autres'
  };

  // Iconify icons per category (Material Symbols, widely available)
  const iconByLabel = {
    'Roues': 'material-symbols:pedal-bike',
    'Freins': 'material-symbols:build',
    'Transmission': 'material-symbols:settings',
    'Selle': 'material-symbols:event-seat',
    'Guidon': 'material-symbols:directions-bike',
    'Autres': 'material-symbols:category'
  };

  return (
    <div className="bike-detail">
      {!bike ? (
        <div style={{ padding: '20px', color: '#9ca3af' }}>Aucun vélo sélectionné</div>
      ) : (
        <>
          {showHeader && (
            <header className="bike-detail-header">
              <h3>Détails du vélo</h3>
              <div className="bike-id">ID: {bike.id}</div>
              {editable && (
                <div className="save-indicator" aria-live="polite" style={{marginLeft:8,color:'#6b7280'}}>{isSaving ? 'Enregistrement…' : ''}</div>
              )}
            </header>
          )}
          {!showHeader && editable && (
            <div className="save-indicator" aria-live="polite" style={{marginBottom:8,color:'#6b7280'}}>{isSaving ? 'Enregistrement…' : ''}</div>
          )}

          {showSummary && (
            <section className="bike-summary">
              <div className="detail-row">
                <div className="detail-label">Marque</div>
                <div className="detail-value">
                  {editable ? (
                    <>
                      <input list="brands" value={form.brand} onChange={e => updateField('brand', e.target.value)} placeholder="ex: Trek" />
                      <datalist id="brands">
                        {BRAND_OPTIONS.map(b => (<option key={b} value={b} />))}
                      </datalist>
                    </>
                  ) : (<span style={{ color: !brand ? '#9ca3af' : undefined }}>{brand || 'Inconnu'}</span>)}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Modèle</div>
                <div className="detail-value">
                  {editable ? (
                    <input value={form.model} onChange={e => updateField('model', e.target.value)} placeholder="ex: Domane" />
                  ) : (<span style={{ color: !model ? '#9ca3af' : undefined }}>{model || 'Inconnu'}</span>)}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Type de roues</div>
                <div className="detail-value">
                  {editable ? (
                    <>
                      <input list="types" value={form.type} onChange={e => updateField('type', e.target.value)} placeholder="ex: VTT / Ville" />
                      <datalist id="types">
                        {TYPE_OPTIONS.map(t => (<option key={t} value={t} />))}
                      </datalist>
                    </>
                  ) : (<span style={{ color: !bike.type ? '#9ca3af' : undefined }}>{bike.type || 'Inconnu'}</span>)}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Taille du cadre</div>
                <div className="detail-value">
                  {editable ? (
                    <>
                      <input list="frameSizes" value={form.frame_size} onChange={e => updateField('frame_size', e.target.value)} placeholder="ex: M / L / 54" />
                      <datalist id="frameSizes">
                        {FRAME_SIZE_OPTIONS.map(s => (<option key={s} value={s} />))}
                      </datalist>
                    </>
                  ) : (<span style={{ color: !bike.frame_size ? '#9ca3af' : undefined }}>{bike.frame_size || 'Inconnu'}</span>)}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Taille des roues</div>
                <div className="detail-value">
                  {editable ? (
                    <>
                      <input list="wheelSizes" value={form.wheel_size} onChange={e => updateField('wheel_size', e.target.value)} placeholder="ex: 700C / 29" />
                      <datalist id="wheelSizes">
                        {WHEEL_SIZE_OPTIONS.map(s => (<option key={s} value={s} />))}
                      </datalist>
                    </>
                  ) : (<span style={{ color: !bike.wheel_size ? '#9ca3af' : undefined }}>{bike.wheel_size || 'Inconnu'}</span>)}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">Année</div>
                <div className="detail-value">
                  {editable ? (
                    <>
                      <input list="years" value={form.year} onChange={e => updateField('year', e.target.value)} placeholder="ex: 2023" />
                      <datalist id="years">
                        {Array.from({ length: 40 }, (_, i) => CURRENT_YEAR - i).map(y => (<option key={y} value={y} />))}
                      </datalist>
                    </>
                  ) : (<span style={{ color: !bike.year ? '#9ca3af' : undefined }}>{bike.year || 'Inconnu'}</span>)}
                </div>
              </div>
              <div className="detail-row">
                <div className="detail-label">N° de série</div>
                <div className="detail-value">
                  {editable ? (
                    <input value={form.serial_number} onChange={e => updateField('serial_number', e.target.value)} placeholder="ex: SN12345ABC" />
                  ) : (<span style={{ color: !bike.serial_number ? '#9ca3af' : undefined }}>{bike.serial_number || 'Inconnu'}</span>)}
                </div>
              </div>

              <div className="detail-row">
                <div className="detail-label">Couleurs</div>
                <div className="detail-value">
                  {editable ? (
                    <div className="color-swatches">
                      {COLOR_OPTIONS.map((c) => {
                        const selected = Array.isArray(form.colors) && form.colors.includes(c);
                        return (
                          <button
                            key={c}
                            type="button"
                            className="color-swatch"
                            onClick={() => {
                              setForm(prev => {
                                const prevColors = Array.isArray(prev.colors) ? prev.colors : [];
                                return ({
                                  ...prev,
                                  colors: selected ? prevColors.filter(x => x !== c) : [...prevColors, c]
                                });
                              });
                            }}
                            aria-pressed={selected}
                            title={c}
                            style={{ outline: selected ? '2px solid #3b82f6' : 'none' }}
                          >
                            <span className="swatch-dot" data-color={c}></span>
                            <span className="swatch-label">{c}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    colors.length ? (
                      <div className="color-swatches">
                        {colors.map((c) => (
                          <div key={c} className="color-swatch" title={c}>
                            <span className="swatch-dot" data-color={c}></span>
                            <span className="swatch-label">{c}</span>
                          </div>
                        ))}
                      </div>
                    ) : <span style={{ color: '#9ca3af' }}>Aucune</span>
                  )}
                </div>
              </div>
            </section>
          )}

          <section className="components-section">
            <div className="section-title">Composants installés</div>
            {!bike.components || bike.components.length === 0 ? (
              <div className="empty-note">Aucun composant enregistré.</div>
            ) : (
              <div className="component-groups">
                {Object.entries(groups).map(([key, items]) => {
                  const label = labelByKey[key] || key.charAt(0).toUpperCase() + key.slice(1);
                  const icon = iconByLabel[label] || 'material-symbols:category';
                  return (
                    <div key={key} className="component-group">
                      <div className="group-header"><Icon icon={icon} className="group-icon" width="18" height="18" aria-hidden />{label}</div>
                      <div className="component-list">
                        {items.map(comp => <ComponentItem key={comp.id} comp={comp} />)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
