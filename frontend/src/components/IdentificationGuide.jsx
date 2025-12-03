import React from 'react';
import '../styles/IdentificationGuide.css';

// Props: unknown { brand:boolean, model:boolean, colors:boolean, frame_size:boolean, type:boolean }
export default function IdentificationGuide({ unknown = {}, onClose }) {
  const tasks = [];
  if (unknown.brand || unknown.model) {
    tasks.push({
      key: 'catalogue',
      title: 'Comparer avec un catalogue',
      detail: 'Ouvrez le site du fabricant ou des revendeurs (Decathlon, Alltricks) et recherchez visuellement le cadre similaire.'
    });
    tasks.push({
      key: 'photo_cadre',
      title: 'Photo du cadre côté transmission',
      detail: 'Prendre une photo nette côté chaînes/pédalier pour repérer logos ou formes distinctives.'
    });
  }
  if (unknown.frame_size) {
    tasks.push({
      key: 'mesure_tube',
      title: 'Mesurer le tube de selle',
      detail: 'Mesurer du centre du boîtier de pédalier jusqu’au haut du tube où la tige sort (en cm).'
    });
    tasks.push({
      key: 'entrejambe',
      title: 'Mesurer votre entrejambe',
      detail: 'Entrejambe x 0.67 ≈ taille cadre route; x 0.66 ≈ VTT. Comparez aux tableaux des marques.'
    });
  }
  if (unknown.colors) {
    tasks.push({
      key: 'photo_couleurs',
      title: 'Photos sous bonne lumière',
      detail: 'Prendre 2–3 photos en lumière naturelle (sans flash) pour détecter précisément la/les couleurs.'
    });
  }
  if (unknown.type) {
    tasks.push({
      key: 'caracteristiques_type',
      title: 'Identifier le type',
      detail: 'Regardez pneus (cramponnés=VTT, lisses fins=route, larges avec garde-boue=urbain), présence suspension, position de conduite.'
    });
  }

  const advanced = [
    { key: 'freins', title: 'Différencier freins', detail: 'Disque: rotor circulaire et étrier sur le moyeu. Patins: étriers serrent la jante.' },
    { key: 'transmission', title: 'Transmission', detail: 'Compter plateaux (avant) et pignons (arrière): vous obtenez le nombre de vitesses.' },
    { key: 'matériel_cadre', title: 'Matériau cadre', detail: 'Soudures visibles = aluminium; tubes fins lisses = carbone; raccords chromés = acier.' }
  ];

  return (
    <div className="id-guide-modal" role="dialog" aria-modal="true">
      <div className="id-guide-panel">
        <div className="id-guide-header">
          <h3>Guide d'identification</h3>
          <button className="btn tertiary" onClick={onClose}>✕</button>
        </div>
        <p className="intro">Suivez ces actions pour réduire les champs "Je ne sais pas" et améliorer le futur plan d'entretien.</p>
        <ul className="guide-tasks">
          {tasks.map(t => (
            <li key={t.key} className="task">
              <div className="task-title">{t.title}</div>
              <div className="task-detail">{t.detail}</div>
              <button type="button" className="btn small" onClick={() => { /* placeholder for marking done */ }}>Marquer fait</button>
            </li>
          ))}
          {tasks.length === 0 && <li className="task empty">Aucune inconnue critique. Vous pouvez affiner les composants avancés.</li>}
        </ul>
        <h4 style={{marginTop:16}}>Analyse avancée</h4>
        <ul className="guide-tasks advanced">
          {advanced.map(a => (
            <li key={a.key} className="task">
              <div className="task-title">{a.title}</div>
              <div className="task-detail">{a.detail}</div>
            </li>
          ))}
        </ul>
        <div className="actions-row">
          <button className="btn secondary" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  );
}
