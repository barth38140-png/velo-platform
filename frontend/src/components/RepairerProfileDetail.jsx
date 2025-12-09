import React from 'react';

/**
 * Détail d'un réparateur (squelette minimal)
 * Props : repairer (objet), onBack (fonction)
 */
function RepairerProfileDetail({ repairer, onBack }) {
  if (!repairer) return null;
  return (
    <div style={{padding:24, maxWidth:480}}>
      <button onClick={onBack} style={{marginBottom:16, background:'#f1f5f9', border:'none', borderRadius:8, padding:'6px 14px', cursor:'pointer'}}>← Retour</button>
      <h2 style={{fontSize:'1.3em',marginBottom:8}}>{repairer.name || repairer.display_name || 'Réparateur'}</h2>
      <div style={{marginBottom:8}}><b>Compétences :</b> {Array.isArray(repairer.skills) ? repairer.skills.join(', ') : repairer.skills}</div>
      {repairer.bio && <div style={{marginBottom:8}}><b>Bio :</b> {repairer.bio}</div>}
      {repairer.rating !== undefined && <div style={{marginBottom:8}}><b>Note :</b> {repairer.rating} / 5</div>}
      {repairer.location_lat && repairer.location_lng && (
        <div style={{marginBottom:8}}>
          <b>Localisation :</b> lat {repairer.location_lat}, lng {repairer.location_lng}
        </div>
      )}
      {/* Ajoute ici d'autres infos utiles */}
    </div>
  );
}

export default RepairerProfileDetail;
