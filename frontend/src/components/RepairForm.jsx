import React, { useState, useRef, Suspense, lazy } from 'react';
import { repairService, repairPhotoService, bikeService } from '../services/api';
import StepForm from './StepForm';
import LocationSelector from './LocationSelector';
import MapPicker from './MapPicker';
const LazyAddBikePage = lazy(() => import('./AddBikePage'));

export default function RepairForm({ initial = {}, onSuccess, onCancel }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    bikeType: initial.bikeType || '',
    bikeId: initial.bikeId || null,
    problem: initial.problem || '',
    problemText: initial.problemText || '',
    subNeed: initial.subNeed || '',
    subNeedText: initial.subNeedText || '',
    details: initial.details || '',
    photos: initial.photos || [],
    locationLat: initial.locationLat || null,
    locationLng: initial.locationLng || null,
    locationAddress: initial.locationAddress || '',
    precise: initial.precise || ''
  });
  const [bikes, setBikes] = useState([]);
  const [showBikeModal, setShowBikeModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [photosError, setPhotosError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [bikeError, setBikeError] = useState('');
  const [problemError, setProblemError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [stepTopError, setStepTopError] = useState('');
  const mapResetCounterRef = useRef(0);
  const MAX_PHOTOS = 6;
  const MAX_PHOTO_BYTES = 5 * 1024 * 1024; // 5MB per photo

  const generateTitle = (f = formData) => {
    const problem = (f.problem || 'réparation').toString().trim();
    const type = (f.bikeType || '').toString().trim();
    let title = `Réparation ${problem}`;
    if (type) title += ` — ${type}`;
    if (f.locationAddress) {
      const shortAddr = String(f.locationAddress).split(',')[0];
      if (shortAddr) title += ` à ${shortAddr}`;
    }
    return title;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError('');
    if (!formData.bikeId || !formData.problem) return setError('Veuillez sélectionner un vélo et un besoin principal');
    setLoading(true);
    try {
      const title = (generateTitle() || '').toString().trim();
      const description = (formData.details || (formData.problem ? `Besoin principal: ${formData.problem}` : 'Demande de réparation')).toString().trim();
      if (!title || !description) {
        setError('Veuillez fournir un titre et une description');
        setLoading(false);
        return;
      }
      const safeBikeType = (formData.bikeType || '').toString().trim() || 'Général';
      const resp = await repairService.createRepair(
        title,
        description,
        safeBikeType,
        formData.locationLat,
        formData.locationLng,
        (formData.locationAddress || formData.precise || '').toString(),
        { bikeId: formData.bikeId, problem: formData.problem, subNeed: formData.subNeed, note: formData.details }
      );
      // If photos were attached, upload them to the photos endpoint
      const created = resp?.data?.repair || resp;
      if (formData.photos && formData.photos.length > 0 && created && created.id) {
        try {
          const fd = new FormData();
          for (const f of formData.photos) fd.append('photos', f, f.name || 'photo.jpg');
          const up = await repairPhotoService.uploadPhotos(created.id, fd);
          // merge returned photo meta into created object for event consumers
          if (up && up.data && up.data.photos) {
            created.photos = up.data.photos;
          }
        } catch (uperr) {
          console.warn('Photo upload failed', uperr);
        }
      }
      setSuccess('Demande envoyée');
      setTimeout(() => setSuccess(''), 3000);
      mapResetCounterRef.current += 1;
      setFormData({ bikeType: '', bikeId: null, problem: '', problemText: '', subNeed: '', subNeedText: '', details: '', photos: [], locationLat: null, locationLng: null, locationAddress: '', precise: '' });
      try { window.dispatchEvent(new CustomEvent('repairCreated', { detail: resp?.data?.repair || resp })); } catch (e) { /* ignore */ }
      onSuccess && onSuccess(resp?.data?.repair || resp);
    } catch (err) {
      console.error('create repair', err);
      // If backend returned detailed validation errors, show them
      const resp = err && err.response && err.response.data;
      if (resp && Array.isArray(resp.errors)) {
        const msg = resp.errors.map(e => `${e.field}: ${e.message}`).join(' | ');
        setError(msg);
      } else if (resp && resp.error) {
        setError(resp.error);
      } else {
        setError(err?.message || 'Erreur');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pure validators (no setState) — safe to call during render
  const isPhotosValid = (files) => {
    if (!files || files.length === 0) return true;
    if (files.length > MAX_PHOTOS) return false;
    for (const f of files) {
      if (f.size && f.size > MAX_PHOTO_BYTES) return false;
    }
    return true;
  };

  const isLocationValid = (f) => {
    if (!f) return false;
    return !!(f.locationLat && f.locationLng && f.locationAddress);
  };

  const canProceed = (currentStep) => {
    if (currentStep === 0) return !!(formData.bikeId && formData.problem && !(formData.problem === 'autre' && !formData.problemText));
    if (currentStep === 1) return !!(formData.subNeed && !(formData.subNeed === 'autre_besoin' && !formData.subNeedText));
    if (currentStep === 2) return isLocationValid(formData);
    return true;
  };

  // Attempt to go to next step, but validate and show inline messages if missing
  const tryNext = () => {
    // clear top confirm error when moving around
    setConfirmError('');
    setStepTopError('');
    // Step 0 contains bike selection AND besoin selection
    if (step === 0) {
      if (!formData.bikeId) {
        const msg = "Veuillez sélectionner un vélo avant de continuer.";
        // show single top-banner message
        setBikeError('');
        setProblemError('');
        setStepTopError(msg);
        return;
      }
      if (!formData.problem || (formData.problem === 'autre' && !formData.problemText)) {
        const msg = "Veuillez sélectionner votre besoin principal avant de continuer.";
        setBikeError('');
        setProblemError('');
        setStepTopError(msg);
        return;
      }
    }
    if (step === 1) {
      // Step 1: require a sub-need (precision) related to the main besoin
      if (!formData.subNeed) {
        const msg = 'Veuillez préciser votre besoin avant de continuer.';
        setStepTopError(msg);
        setPhotosError('');
        return;
      }
      if (formData.subNeed === 'autre_besoin' && !formData.subNeedText) {
        const msg = 'Veuillez renseigner la précision demandée.';
        setStepTopError(msg);
        return;
      }
    }
    if (step === 2) {
      if (!isLocationValid(formData)) {
        const msg = 'Veuillez fournir une localisation précise (adresse) avant de continuer.';
        setLocationError(msg);
        setStepTopError(msg);
        return;
      }
    }
    setStep(s => Math.min(3, s + 1));
  };

  const trySubmit = async () => {
    // final validation before submit
    setConfirmError('');
    if (!confirmChecked) {
      const msg = 'Veuillez confirmer avant de valider la demande.';
      setConfirmError(msg);
      setStepTopError(msg);
      return;
    }
    // also ensure bike/problem/location present
    if (!formData.bikeId) {
      const msg = 'Veuillez sélectionner un vélo avant de valider.';
      setBikeError(msg);
      setStepTopError(msg);
      setStep(0);
      return;
    }
    if (!formData.problem || (formData.problem === 'autre' && !formData.problemText)) {
      const msg = 'Veuillez sélectionner un besoin principal avant de valider.';
      setProblemError(msg);
      setStepTopError(msg);
      setStep(0);
      return;
    }
    // Ensure sub-need is present before final submit
    if (!formData.subNeed) {
      const msg = 'Veuillez préciser votre besoin avant de valider.';
      setStepTopError(msg);
      setStep(1);
      return;
    }
    if (formData.subNeed === 'autre_besoin' && !formData.subNeedText) {
      const msg = 'Veuillez renseigner la précision demandée.';
      setStepTopError(msg);
      setStep(1);
      return;
    }
    
    if (!isLocationValid(formData)) {
      const msg = 'Veuillez fournir une localisation précise (adresse) avant de valider.';
      setLocationError(msg);
      setStepTopError(msg);
      setStep(2);
      return;
    }
    // All good, call existing submit
    await handleSubmit();
  };

  // Re-validate when photos or location change to update inline errors
  // Re-validate when photos change and set errors (side-effects kept in effects)
  React.useEffect(() => {
    // update photosError message based on current photos
    if (!formData.photos || formData.photos.length === 0) {
      setPhotosError('');
      return;
    }
    if (formData.photos.length > MAX_PHOTOS) {
      setPhotosError(`Vous pouvez joindre au maximum ${MAX_PHOTOS} photos.`);
      return;
    }
    for (const f of formData.photos) {
      if (f.size && f.size > MAX_PHOTO_BYTES) {
        setPhotosError('Chaque photo doit faire moins de 5 Mo.');
        return;
      }
    }
    setPhotosError('');
  }, [formData.photos]);

  React.useEffect(() => {
    if (isLocationValid(formData)) {
      setLocationError('');
    } else {
      // only set a user-facing message when user is on or leaving the location step
      setLocationError('');
    }
  }, [formData.locationLat, formData.locationLng, formData.locationAddress]);

  // Clear bike / problem errors when user fixes input
  React.useEffect(() => {
    if (formData.bikeId) setBikeError('');
  }, [formData.bikeId]);

  React.useEffect(() => {
    if (formData.problem && !(formData.problem === 'autre' && !formData.problemText)) setProblemError('');
  }, [formData.problem, formData.problemText]);

  React.useEffect(() => {
    if (confirmChecked) setConfirmError('');
  }, [confirmChecked]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return setError('Géolocalisation non supportée');
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        const addr = data.display_name || '';
        setFormData(f => ({ ...f, locationLat: lat, locationLng: lng, locationAddress: addr }));
      } catch {
        setError('Impossible de récupérer l\'adresse');
      } finally {
        setLoading(false);
      }
    }, () => { setLoading(false); setError('Autorisation géolocalisation refusée'); });
  };

  const loadBikes = async () => {
    try {
      const data = await bikeService.getMyBikes();
      const list = (data && data.bikes) ? data.bikes : (Array.isArray(data) ? data : []);
      setBikes(list || []);
      return list || [];
    } catch (e) {
      console.error('loadBikes', e);
      setBikes([]);
      return [];
    }
  };

  React.useEffect(() => { loadBikes(); }, []);

  const subNeedsMap = {
    freins: [
      { key: 'freins_grincent', label: 'Freins qui grincent', icon: '🛑' },
      { key: 'freins_plus_freinent', label: 'Freins qui ne freinent plus', icon: '⚠️' },
      { key: 'freins_bloques', label: 'Freins bloqués', icon: '🔒' },
      { key: 'freins_frottent', label: 'Freins qui frottent en continu', icon: '🔧' },
      { key: 'purge_hydraulique', label: 'Purge hydraulique', icon: '🧪' },
      { key: 'changement_plaquettes', label: 'Changement de plaquettes', icon: '🧩' },
      { key: 'changement_patins', label: 'Changement de patins', icon: '🔩' },
    ],
    pneus: [
      { key: 'crevaison', label: 'Crevaison', icon: '📍' },
      { key: 'pneu_deg', label: 'Pneu dégonflé', icon: '💨' },
      { key: 'roue_voilee', label: 'Roue voilée', icon: '🌀' },
      { key: 'usure_importante', label: 'Usure importante du pneu', icon: '🔎' },
      { key: 'mauvaise_pression', label: 'Mauvaise pression régulière', icon: '⚖️' },
    ],
    transmission: [
      { key: 'chaine_saute', label: 'Chaîne qui saute', icon: '🔗' },
      { key: 'derailleur_mal_regle', label: 'Dérailleur mal réglé', icon: '🛠️' },
      { key: 'transmission_bruyante', label: 'Transmission bruyante', icon: '🔊' },
      { key: 'difficulte_vitesse', label: 'Difficulté à changer de vitesse', icon: '⚙️' },
      { key: 'chaine_casse', label: 'Chaîne qui casse souvent', icon: '⛓️' },
    ],
    cadre: [
      { key: 'cadre_fissure', label: 'Cadre fissuré', icon: '⚠️' },
      { key: 'fourche_craque', label: 'Fourche qui craque', icon: '🔊' },
      { key: 'jeu_direction', label: 'Jeu dans la direction', icon: '🔩' },
      { key: 'cadre_tordu', label: 'Cadre tordu après chute', icon: '🪫' },
      { key: 'peinture_abimee', label: 'Peinture abîmée', icon: '🎨' },
    ],
    eclairage: [
      { key: 'eclairage_ne_fonctionne_pas', label: "Éclairage qui ne fonctionne pas", icon: '💡' },
      { key: 'batterie_faible', label: 'Batterie faible', icon: '🔋' },
      { key: 'fixation_cassee', label: 'Fixation cassée', icon: '🔧' },
      { key: 'eclairage_faible', label: 'Éclairage trop faible', icon: '🌙' },
      { key: 'eclairage_s_etient', label: "Éclairage qui s’éteint en roulant", icon: '🚫' },
    ],
    revision: [
      { key: 'revision_complete', label: 'Révision complète', icon: '🔁' },
      { key: 'revision_rapide', label: 'Révision rapide', icon: '⚡' },
      { key: 'controle_securite', label: 'Contrôle de sécurité avant un long trajet', icon: '🛣️' },
      { key: 'revision_saisonniere', label: 'Révision saisonnière (hiver/été)', icon: '🍂' },
    ],
  };

  return (
    <div className="repair-form-shell">
      {error && <div className="error-toast small">{error}</div>}
      {success && <div className="success-toast">{success}</div>}

      <StepForm steps={["Catégorie", "Précisez votre besoin", "Localisation", "Confirmation"]} current={step}>
        {({ current, total }) => (
          <div>
            {stepTopError && <div className="step-top-error" style={{background:'#ffefef', color:'#b00020', padding:8, borderRadius:6, marginBottom:8}}>{stepTopError}</div>}
            <div className="step-panel-content">
              {current === 0 && (
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label className="label">Sélectionnez le vélo concerné par votre demande</label>
                    <div style={{fontSize:'0.9rem', color:'#555'}}>Étape 1/4</div>
                  </div>

                  {bikes && bikes.length > 0 ? (
                    <div className="bike-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12, marginTop:8}}>
                      {bikes.map(b => (
                        <button key={b.id} type="button" className={`bike-card ${formData.bikeId === b.id ? 'selected' : ''}`} onClick={() => { setFormData({ ...formData, bikeId: b.id, bikeType: b.type || formData.bikeType }); }} style={{padding:12, borderRadius:10, border: formData.bikeId === b.id ? '2px solid #2a9d8f' : '1px solid #e6eef0', background:'#fff', textAlign:'left', cursor:'pointer', position:'relative'}}>
                          <div style={{display:'flex', alignItems:'center', gap:10}}>
                            <div style={{width:48, height:48, borderRadius:6, background:'#f1f5f5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18}} aria-hidden>🚲</div>
                            <div>
                              <div style={{fontWeight:700}}>{b.name || b.model || 'Vélo'}</div>
                              <div style={{fontSize:12, color:'#666'}}>{b.type || ''} {b.frame_size ? `• ${b.frame_size}` : ''}</div>
                            </div>
                          </div>
                          {formData.bikeId === b.id && <div style={{position:'absolute', right:8, top:8}}>✅</div>}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div style={{marginTop:8}}>
                      <div className="empty-list">Vous n'avez pas encore de vélo enregistré.</div>
                      <div style={{marginTop:10}}>
                        <button type="button" className="btn primary" onClick={() => setShowBikeModal(true)}>➕ Ajouter un vélo</button>
                      </div>
                    </div>
                  )}
                  {/* Show either top-banner or per-field error, not both */}
                  {!stepTopError && bikeError && <div className="field-error small" style={{color:'#b00020', marginTop:8}}>{bikeError}</div>}

                  <div style={{marginTop:16}}>
                    <label className="label">Quel est votre besoin principal ?</label>
                    <div className="issue-buttons" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))', gap:12}}>
                      {[
                        { key: 'freins', label: 'Freins', icon: '🛑' },
                        { key: 'transmission', label: 'Transmission / Chaîne', icon: '🔧' },
                        { key: 'pneus', label: 'Pneus / Roues', icon: '🔩' },
                        { key: 'cadre', label: 'Cadre / Fourche', icon: '🦾' },
                        { key: 'eclairage', label: 'Éclairage / Accessoires', icon: '💡' },
                        { key: 'revision', label: 'Révision', icon: '🔁' },
                      ].map(it => (
                        <button key={it.key} type="button" className={`issue-btn ${formData.problem === it.key ? 'active' : ''}`} onClick={() => setFormData({ ...formData, problem: it.key, problemText: '' })} style={{padding:16, borderRadius:10, border: formData.problem === it.key ? '2px solid #2a9d8f' : '1px solid #dfecee', background: formData.problem === it.key ? '#e6fffb' : '#fff', display:'flex', alignItems:'center', gap:12, minHeight:56, fontSize:14}}>
                          <span style={{fontSize:20}}>{it.icon}</span>
                          <span style={{fontWeight:700}}>{it.label}</span>
                        </button>
                      ))}
                      <button type="button" className={`issue-btn ${formData.problem === 'autre' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, problem: 'autre' })} style={{padding:16, borderRadius:10, border: formData.problem === 'autre' ? '2px solid #2a9d8f' : '1px solid #dfecee', background: formData.problem === 'autre' ? '#e6fffb' : '#fff', minHeight:56}}>
                        ➕ Autre besoin
                      </button>
                    </div>
                    {formData.problem === 'autre' && (
                      <textarea value={formData.problemText || ''} onChange={(e) => setFormData({ ...formData, problemText: e.target.value })} placeholder="Décrivez votre besoin" style={{width:'100%', marginTop:8, padding:10, borderRadius:8}} />
                    )}
                    {/* Show either top-banner or per-field error, not both */}
                    {!stepTopError && problemError && <div className="field-error small" style={{color:'#b00020', marginTop:8}}>{problemError}</div>}
                  </div>
                </div>
              )}

              {current === 1 && (
                <div>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <label className="label">Précisez votre besoin</label>
                    <div style={{fontSize:'0.9rem', color:'#555'}}>Étape {current + 1}/{total}</div>
                  </div>

                  {!formData.problem && <div style={{marginTop:8}} className="field-note">Veuillez d'abord sélectionner votre besoin principal à l'étape précédente.</div>}

                  {formData.problem && (
                    <div style={{marginTop:8}}>
                      <div className="subneed-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12}}>
                        {(subNeedsMap[formData.problem] || []).map(s => (
                          <button key={s.key} type="button" className={`issue-btn ${formData.subNeed === s.key ? 'active' : ''}`} onClick={() => setFormData({ ...formData, subNeed: s.key, subNeedText: '' })} style={{padding:12, borderRadius:8, border: formData.subNeed === s.key ? '2px solid #2a9d8f' : '1px solid #dfecee', background: formData.subNeed === s.key ? '#e6fffb' : '#fff', minHeight:48, display:'flex', gap:8, alignItems:'center'}}>
                            <span style={{fontSize:18}}>{s.icon}</span>
                            <span style={{fontWeight:700}}>{s.label}</span>
                          </button>
                        ))}
                        <button type="button" className={`issue-btn ${formData.subNeed === 'autre_besoin' ? 'active' : ''}`} onClick={() => setFormData({ ...formData, subNeed: 'autre_besoin' })} style={{padding:12, borderRadius:8, border: formData.subNeed === 'autre_besoin' ? '2px solid #2a9d8f' : '1px solid #dfecee', background: formData.subNeed === 'autre_besoin' ? '#e6fffb' : '#fff', minHeight:48}}>
                          ➕ Autre besoin
                        </button>
                      </div>

                      {formData.subNeed === 'autre_besoin' && (
                        <textarea value={formData.subNeedText || ''} onChange={(e) => setFormData({ ...formData, subNeedText: e.target.value })} placeholder="Décrivez votre besoin" style={{width:'100%', marginTop:8, padding:10, borderRadius:8}} />
                      )}

                      {!stepTopError && !formData.subNeed && <div className="field-error small" style={{color:'#b00020', marginTop:8}}>Veuillez sélectionner une précision.</div>}
                      {!stepTopError && formData.subNeed === 'autre_besoin' && !formData.subNeedText && <div className="field-error small" style={{color:'#b00020', marginTop:8}}>Veuillez préciser votre besoin.</div>}
                    </div>
                  )}
                </div>
              )}

              {current === 2 && (
                <div>
                  <label className="label">Localisation</label>
                  <LocationSelector initial={{ locationLat: formData.locationLat, locationLng: formData.locationLng, locationAddress: formData.locationAddress, precise: formData.precise }} onChange={(p) => setFormData(f => ({ ...f, locationLat: p.locationLat || f.locationLat, locationLng: p.locationLng || f.locationLng, locationAddress: p.locationAddress || f.locationAddress, precise: p.precise || f.precise }))} />
                  {!stepTopError && locationError && <div className="field-error small" style={{color:'#b00020', marginTop:6}}>{locationError}</div>}
                  <div className="location-actions">
                    <button type="button" className="btn tertiary" onClick={useMyLocation}>Utiliser ma position</button>
                    <small className="micro">Localisation précise aide le mécanicien.</small>
                  </div>
                </div>
              )}

              {current === 3 && (
                <div>
                  <h4>Confirmation</h4>
                  <p><strong>Type :</strong> {formData.bikeType}</p>
                  <p><strong>Besoin :</strong> {formData.problem}</p>
                  <p><strong>Détails :</strong> {formData.details || '—'}</p>
                  <p><strong>Adresse :</strong> {formData.locationAddress || formData.precise || '—'}</p>
                  <div style={{marginTop:12}}>
                    <label style={{display:'flex', alignItems:'center', gap:8}}>
                      <input type="checkbox" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
                      <span>Je confirme que les informations ci-dessus sont correctes</span>
                    </label>
                    {!stepTopError && confirmError && <div className="field-error small" style={{color:'#b00020', marginTop:8}}>{confirmError}</div>}
                  </div>
                </div>
              )}
            </div>

            <div className="form-actions" style={{marginTop:16, display:'flex', justifyContent:'center'}}>
              <div style={{display:'flex', gap:12, justifyContent:'center', alignItems:'center'}}>
                {current > 0 && <button type="button" className="btn secondary" onClick={() => setStep(s => Math.max(0, s - 1))}>Précédent</button>}
                {current < total - 1 && <button type="button" className="btn primary" onClick={tryNext}>{'Suivant'}</button>}
                {current === total - 1 && <button data-cy="repair-submit" type="button" className="btn primary" onClick={trySubmit} disabled={loading}>{loading ? 'Création...' : 'Valider'}</button>}
                {onCancel && <button type="button" className="btn secondary" onClick={onCancel}>Annuler</button>}
              </div>
            </div>
          </div>
        )}
      </StepForm>
      {showBikeModal && (
        <Suspense fallback={<div style={{padding:16}}>Chargement du formulaire vélo...</div>}>
          <LazyAddBikePage conversational onClose={async () => { setShowBikeModal(false); const list = await loadBikes(); if (list && list.length) { const last = list[list.length - 1]; setFormData(f => ({ ...f, bikeId: last.id, bikeType: last.type || f.bikeType })); } }} />
        </Suspense>
      )}
    </div>
  );
}
