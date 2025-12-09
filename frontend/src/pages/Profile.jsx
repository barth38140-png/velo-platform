import { useNavigate } from 'react-router-dom';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import SkillsInput from "../components/SkillsInput";
import MapPicker from '../components/MapPicker.jsx';
import { useAuth } from '../context/AuthContext';
import { authService, repairerService } from '../services/api';
import { fetchSkills, addSkill } from '../services/api';
import '../styles/ProfileModern.css';

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', role: '' });
  // Ajout de l'état repairerProfile pour éviter l'erreur ReferenceError
  const [repairerProfile, setRepairerProfile] = useState({
    skills: [], // tableau de compétences
    bio: '',
    service_radius_km: 10,
    is_available: true
  });
  // Suggestions de compétences dynamiques
  const [skillSuggestions, setSkillSuggestions] = useState([]);
    // Charger les suggestions de compétences partagées
    useEffect(() => {
      async function loadSkills() {
        try {
          const skills = await fetchSkills();
          setSkillSuggestions(skills.map(s => s.name));
        } catch (e) {
          // Optionnel : logger ou ignorer
        }
      }
      loadSkills();
    }, []);
  
    // États pour la gestion du formulaire
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [skillInput, setSkillInput] = useState('');
  
    // Fonction pour charger le profil utilisateur
    const loadProfile = useCallback(async () => {
      setLoading(true);
      setError('');
      try {
        // Chargement du profil utilisateur principal
        const { data: userData } = await authService.getProfile();
        console.debug('[DEBUG] Réponse API /users/profile:', userData);
        const user = userData?.user || {};
        setProfile({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          role: user?.role || ''
        });
        // Chargement du profil réparateur si besoin
        if (user?.role === 'repairer') {
          // Recherche d'un identifiant de réparateur (id, repairer_id, etc.)
          const repairerId = user.repairer_id || user.id || user._id;
          if (repairerId) {
            try {
              const { data: repairerData } = await repairerService.getRepairerProfile(repairerId);
              // Correction : utiliser la clé 'repairer' si présente
              const rep = repairerData.repairer || repairerData;
              // Correction robuste : désérialisation multi-niveaux pour garantir un tableau de chaînes
              let skills = [];
              if (Array.isArray(rep.skills)) {
                skills = rep.skills;
              } else if (typeof rep.skills === 'string') {
                let str = rep.skills;
                try {
                  // Si la string est un JSON imbriqué, on désérialise plusieurs fois
                  while (typeof str === 'string') {
                    const parsed = JSON.parse(str);
                    if (Array.isArray(parsed)) {
                      skills = parsed;
                      break;
                    } else if (typeof parsed === 'string') {
                      str = parsed;
                    } else {
                      break;
                    }
                  }
                  // Si skills n'est toujours pas un tableau, fallback
                  if (!Array.isArray(skills) || skills.length === 0) {
                    // Séparer par virgule ou crochets
                    let cleaned = rep.skills.replace(/\[|\]|"|'/g,"");
                    skills = cleaned.split(',').map(s => s.trim()).filter(Boolean);
                  }
                } catch {
                  // fallback : séparer par virgule si string simple
                  let cleaned = rep.skills.replace(/\[|\]|"|'/g,"");
                  skills = cleaned.split(',').map(s => s.trim()).filter(Boolean);
                }
              }
              // Filtrage des doublons (unicité insensible à la casse)
              skills = skills.filter((item, idx, arr) =>
                arr.findIndex(s => s.toLowerCase() === item.toLowerCase()) === idx
              );
              setRepairerProfile({
                skills,
                bio: rep.bio || '',
                service_radius_km: rep.service_radius_km || 10,
                is_available: typeof rep.is_available === 'boolean' ? rep.is_available : true
              });
            } catch (e) {
              setError("Impossible de charger le profil réparateur (ID non trouvé ou API vide). Veuillez vérifier l'API ou contacter un admin.");
              setRepairerProfile({ skills: [], bio: '', service_radius_km: 10, is_available: true });
            }
          } else {
            setError("Aucun identifiant réparateur trouvé dans le profil utilisateur. Veuillez vérifier l'API ou contacter un admin.");
            setRepairerProfile({ skills: [], bio: '', service_radius_km: 10, is_available: true });
          }
        }
      } catch (e) {
        setError("Erreur lors du chargement du profil utilisateur.");
      }
      setLoading(false);
    }, []);
  
    // Chargement du profil au montage
    useEffect(() => {
      loadProfile();
    }, [loadProfile]);
  
    // Placez tout le code JSX dans le return ci-dessous
    return (
      <div className="profile-modern" style={{justifyContent:'center', alignItems:'center', minHeight:'60vh'}}>
        <div className="profile-modern-main" style={{maxWidth:420, width:'100%', background:'#fff', borderRadius:16, boxShadow:'0 2px 16px rgba(80,80,120,0.09)', padding:'36px 32px', margin:'32px 0'}}>
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:24}}>
            <div style={{width:72,height:72,borderRadius:'50%',background:'#e0e7ef',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'2.3em',fontWeight:700,color:'#764ba2',marginBottom:8}}>
              {profile.name ? profile.name[0].toUpperCase() : '👤'}
            </div>
            <div style={{fontWeight:700,fontSize:'1.35em',color:'#222',marginBottom:2,letterSpacing:0.5}}>{profile.name}</div>
            <span style={{fontSize:'1em',color:'#888',marginBottom:6}}>{profile.email}</span>
            <span style={{display:'inline-block',background:'#e0e7ef',color:'#764ba2',borderRadius:8,padding:'2px 12px',fontWeight:600,fontSize:'0.98em',letterSpacing:1,marginBottom:8}}>{profile.role ? profile.role.toUpperCase() : ''}</span>
          </div>
          {loading ? (
            <div style={{textAlign:'center',color:'#888',fontSize:'1.1em'}}>Chargement du profil...</div>
          ) : error ? (
            <div className="profile-modern-error">{error}</div>
          ) : (
            <>
              {/* Interface CLIENT */}
              {profile.role === 'client' && (
                <>
                  <div className="profile-modern-fields" style={{display:'flex',flexDirection:'column',gap:18}}>
                    <div>
                      <label className="profile-modern-label">Téléphone</label>
                      {isEditing ? (
                        <input
                          className="profile-modern-input"
                          type="text"
                          value={profile.phone}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          autoFocus
                          maxLength={20}
                        />
                      ) : (
                        <input className="profile-modern-input" type="text" value={profile.phone} disabled />
                      )}
                    </div>
                  </div>
                  <div className="profile-modern-actions" style={{marginTop:32,justifyContent:'center',display:'flex',gap:16}}>
                    {isEditing ? (
                      <>
                        <button
                          className="profile-modern-btn"
                          style={{background:'linear-gradient(90deg,#764ba2,#667eea)',color:'#fff',fontWeight:600,padding:'12px 28px'}}
                          onClick={async () => {
                            setSaving(true);
                            setError('');
                            setSuccess('');
                            if (!profile.phone.match(/^0\d{9}$/)) {
                              setError('Numéro de téléphone invalide (format attendu : 0XXXXXXXXX)');
                              setSaving(false);
                              return;
                            }
                            try {
                              await new Promise(res => setTimeout(res, 600));
                              setSuccess('Profil mis à jour avec succès !');
                              setIsEditing(false);
                            } catch (e) {
                              setError('Erreur lors de la sauvegarde.');
                            }
                            setSaving(false);
                          }}
                          disabled={saving}
                        >
                          💾 Enregistrer
                        </button>
                        <button
                          className="profile-modern-btn"
                          style={{background:'#eee',color:'#764ba2',fontWeight:600,padding:'12px 28px'}}
                          onClick={() => {
                            setIsEditing(false);
                            setError('');
                            setSuccess('');
                            loadProfile();
                          }}
                          disabled={saving}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button className="profile-modern-btn" style={{fontSize:'1.08em',padding:'12px 32px',display:'flex',alignItems:'center',gap:8}} onClick={() => setIsEditing(true)}>
                        <span role="img" aria-label="éditer">✏️</span> Modifier mon profil
                      </button>
                    )}
                  </div>
                  {success && <div style={{color:'#388e3c',marginTop:18,textAlign:'center',fontWeight:500}}>{success}</div>}
                  {error && <div style={{color:'#e53935',marginTop:12,textAlign:'center',fontWeight:500}}>{error}</div>}
                </>
              )}
              {/* Interface REPAIRER */}
              {profile.role === 'repairer' && (
                <>
                  <div className="profile-modern-fields" style={{display:'flex',flexDirection:'column',gap:18}}>
                    <div>
                      <label className="profile-modern-label">Téléphone</label>
                      {isEditing ? (
                        <input
                          className="profile-modern-input"
                          type="text"
                          value={profile.phone}
                          onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                          autoFocus
                          maxLength={20}
                        />
                      ) : (
                        <input className="profile-modern-input" type="text" value={profile.phone} disabled />
                      )}
                    </div>
                    <div>
                      <label className="profile-modern-label">Compétences</label>
                      {isEditing ? (
                        <div>
                          <div style={{display:'flex',flexWrap:'wrap',gap:8,minHeight:36,marginBottom:8}}>
                            {repairerProfile.skills.length === 0 ? (
                              <span style={{color:'#aaa'}}>Aucune compétence</span>
                            ) : repairerProfile.skills.map((skill, idx) => {
                              // Nettoyage de la compétence pour enlever accolades et espaces
                              const cleanSkill = skill.replace(/^[{\[\(]+|[}\]\)]+$/g, '').trim();
                              return (
                                <span key={skill+idx} style={{background:'#d1e7dd',color:'#176c3a',borderRadius:12,padding:'6px 14px',display:'flex',alignItems:'center',fontWeight:500,gap:4,boxShadow:'0 1px 4px #d1e7dd'}}>
                                  {cleanSkill}
                                  <button type="button" aria-label="Supprimer" style={{background:'none',border:'none',color:'#176c3a',marginLeft:4,cursor:'pointer',fontSize:'1em'}} onClick={() => setRepairerProfile(p => ({ ...p, skills: p.skills.filter((s, i) => i !== idx) }))}>×</button>
                                </span>
                              );
                            })}
                          </div>
                          <input
                            className="profile-modern-input"
                            type="text"
                            placeholder="Ajouter une compétence..."
                            value={skillInput}
                            onChange={e => setSkillInput(e.target.value)}
                            onKeyDown={e => {
                              if ((e.key === 'Enter' || e.key === ',') && skillInput.trim()) {
                                e.preventDefault();
                                let val = skillInput.trim();
                                val = val.replace(/^[{\[\(]+|[}\]\)]+$/g, '').trim();
                                const exists = repairerProfile.skills.some(s => s.toLowerCase() === val.toLowerCase());
                                if (val && !exists) {
                                  setRepairerProfile(p => ({ ...p, skills: [...p.skills, val] }));
                                  // Ajout côté backend si nouvelle
                                  addSkill(val).catch(() => {});
                                }
                                setSkillInput('');
                              }
                            }}
                            maxLength={32}
                            style={{marginBottom:8}}
                          />
                          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                            {skillSuggestions.filter(s => !repairerProfile.skills.includes(s) && (!skillInput || s.toLowerCase().includes(skillInput.toLowerCase()))).slice(0,6).map(s => (
                              <button key={s} type="button" style={{background:'#e0e7ef',color:'#764ba2',border:'1px solid #d1e7dd',borderRadius:12,padding:'5px 12px',marginBottom:2,cursor:'pointer',fontSize:'0.98em'}} onClick={() => {
                                const exists = repairerProfile.skills.some(skill => skill.toLowerCase() === s.toLowerCase());
                                if (!exists) {
                                  setRepairerProfile(p => ({ ...p, skills: [...p.skills, s] }));
                                  addSkill(s).catch(() => {});
                                }
                                setSkillInput('');
                              }}>{s}</button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="profile-modern-input" style={{background:'#f5f6fa',minHeight:32,display:'flex',flexWrap:'wrap',gap:8}}>
                          {repairerProfile.skills.length === 0 ? (
                            <span style={{color:'#aaa'}}>Aucune compétence</span>
                          ) : repairerProfile.skills.map((skill, idx) => {
                            // Nettoyage de la compétence pour enlever accolades et espaces
                            const cleanSkill = skill.replace(/^[{\[\(]+|[}\]\)]+$/g, '').trim();
                            return (
                              <span key={skill+idx} style={{background:'#d1e7dd',color:'#176c3a',borderRadius:12,padding:'6px 14px',fontWeight:500,boxShadow:'0 1px 4px #d1e7dd'}}>{cleanSkill}</span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="profile-modern-label">Bio</label>
                      {isEditing ? (
                        <div style={{position:'relative'}}>
                          <textarea
                            className="profile-modern-input"
                            value={repairerProfile.bio}
                            onChange={e => setRepairerProfile(p => ({ ...p, bio: e.target.value }))}
                            rows={3}
                            maxLength={200}
                            style={{paddingRight:'60px'}}
                          />
                          <span style={{position:'absolute',right:8,top:8,fontSize:'0.95em',color:'#888'}}>{repairerProfile.bio.length}/200</span>
                        </div>
                      ) : (
                        <div className="profile-modern-input" style={{background:'#f5f6fa',minHeight:32}}>{repairerProfile.bio}</div>
                      )}
                    </div>
                    <div>
                      <label className="profile-modern-label">Rayon d'intervention (km)</label>
                      {isEditing ? (
                        <input
                          className="profile-modern-input"
                          type="number"
                          min={1}
                          max={100}
                          value={repairerProfile.service_radius_km}
                          onChange={e => setRepairerProfile(p => ({ ...p, service_radius_km: parseInt(e.target.value) || 1 }))}
                        />
                      ) : (
                        <input className="profile-modern-input" type="number" value={repairerProfile.service_radius_km} disabled />
                      )}
                    </div>
                    <div>
                      <label className="profile-modern-label">Disponible</label>
                      {isEditing ? (
                        <input
                          type="checkbox"
                          checked={repairerProfile.is_available}
                          onChange={e => setRepairerProfile(p => ({ ...p, is_available: e.target.checked }))}
                          style={{marginLeft:8}}
                        />
                      ) : (
                        <span style={{marginLeft:8}}>{repairerProfile.is_available ? 'Oui' : 'Non'}</span>
                      )}
                    </div>
                  </div>
                  <div className="profile-modern-actions" style={{marginTop:32,justifyContent:'center',display:'flex',gap:16}}>
                    {isEditing ? (
                      <>
                        <button
                          className="profile-modern-btn"
                          style={{background:'linear-gradient(90deg,#764ba2,#667eea)',color:'#fff',fontWeight:600,padding:'12px 28px',transition:'0.2s',boxShadow:'0 2px 8px #764ba233'}}
                          onClick={async () => {
                            setSaving(true);
                            setError('');
                            setSuccess('');
                            // Validation simple
                            if (!profile.phone.match(/^0\d{9}$/)) {
                              setError('Numéro de téléphone invalide (format attendu : 0XXXXXXXXX)');
                              setSaving(false);
                              return;
                            }
                            try {
                              // Log du payload pour debug
                              const userId = (profile && profile.role === 'repairer' && profile.email) ? (user?.id || user?.user_id || user?._id) : undefined;
                              console.debug('[DEBUG] Payload envoyé à createProfile:', {
                                user_id: userId,
                                skills: repairerProfile.skills,
                                bio: repairerProfile.bio,
                                service_radius_km: repairerProfile.service_radius_km,
                                is_available: repairerProfile.is_available,
                                location_lat: null,
                                location_lng: null,
                                location_address: ''
                              });
                              await repairerService.createProfile(
                                repairerProfile.skills,
                                repairerProfile.bio,
                                repairerProfile.service_radius_km,
                                repairerProfile.is_available,
                                null,
                                null,
                                '',
                                userId
                              );
                              setSuccess('Profil réparateur mis à jour !');
                              setIsEditing(false);
                              await loadProfile();
                            } catch (e) {
                              // Extraction du message d'erreur du backend si disponible
                              let apiError = 'Erreur lors de la sauvegarde.';
                              if (e?.response?.data?.error) {
                                apiError = e.response.data.error;
                              } else if (e?.response?.data?.errors && Array.isArray(e.response.data.errors) && e.response.data.errors.length > 0) {
                                // Si le backend retourne un tableau d'erreurs
                                apiError = e.response.data.errors.map(err => err.msg).join(' | ');
                              }
                              setError(apiError);
                            }
                            setSaving(false);
                          }}
                          disabled={saving}
                        >
                          <span role="img" aria-label="enregistrer" style={{marginRight:8}}>💾</span> Enregistrer
                        </button>
                        <button
                          className="profile-modern-btn"
                          style={{background:'#eee',color:'#764ba2',fontWeight:600,padding:'12px 28px',transition:'0.2s'}}
                          onClick={() => {
                            setIsEditing(false);
                            setError('');
                            setSuccess('');
                            loadProfile();
                          }}
                          disabled={saving}
                        >
                          Annuler
                        </button>
                      </>
                    ) : (
                      <button className="profile-modern-btn" style={{fontSize:'1.08em',padding:'12px 32px',display:'flex',alignItems:'center',gap:8,background:'linear-gradient(90deg,#764ba2,#667eea)',color:'#fff',fontWeight:600,boxShadow:'0 2px 8px #764ba233',transition:'0.2s'}} onClick={() => setIsEditing(true)}>
                        <span role="img" aria-label="éditer">✏️</span> Modifier mon profil
                      </button>
                    )}
                  </div>
                  {success && (
                    <div style={{color:'#388e3c',marginTop:18,textAlign:'center',fontWeight:500,display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <span role="img" aria-label="succès">✅</span>{success}
                    </div>
                  )}
                  {error && (
                    <div style={{color:'#e53935',marginTop:12,textAlign:'center',fontWeight:500}}>{error}</div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    );
}
