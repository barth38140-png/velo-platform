import React from "react";

/**
 * Composant d'édition et d'affichage des compétences sous forme de tags interactifs avec suggestions.
 * Props :
 *  - skills: array (liste des compétences sélectionnées)
 *  - setSkills: function (callback pour mettre à jour la liste)
 */
const skillSuggestions = [
  'freinage',
  'purge hydraulique',
  'transmission',
  'diagnostic',
  'réglage dérailleur',
  'changement de pneu',
  'entretien fourche',
  'montage vélo',
  'électricité',
  'réglage suspension',
  'remplacement chaîne',
  'réglage freins',
  'pose accessoires'
];

export default function SkillsInput({ skills, setSkills, isEditing }) {
  const [skillInput, setSkillInput] = React.useState("");

  // Ajout d'une compétence
  const addSkill = (val) => {
    if (val && !skills.includes(val)) {
      setSkills([...skills, val]);
    }
    setSkillInput("");
  };

  // Suppression d'une compétence
  const removeSkill = (idx) => {
    setSkills(skills.filter((_, i) => i !== idx));
  };

  if (!isEditing) {
    return (
      <div className="profile-modern-input" style={{background:'#f5f6fa',minHeight:32,display:'flex',flexWrap:'wrap',gap:8}}>
        {skills.length === 0 ? <span style={{color:'#aaa'}}>Aucune compétence</span> : skills.map((skill, idx) => (
          <span key={skill+idx} style={{background:'#e0e7ef',color:'#764ba2',borderRadius:8,padding:'4px 10px',fontWeight:500}}>{skill}</span>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div style={{display:'flex',flexWrap:'wrap',gap:8,minHeight:36,marginBottom:8}}>
        {skills.map((skill, idx) => (
          <span key={skill+idx} style={{background:'#e0e7ef',color:'#764ba2',borderRadius:8,padding:'4px 10px',display:'flex',alignItems:'center',fontWeight:500,gap:4}}>
            {skill}
            <button type="button" aria-label="Supprimer" style={{background:'none',border:'none',color:'#764ba2',marginLeft:4,cursor:'pointer',fontSize:'1em'}} onClick={() => removeSkill(idx)}>×</button>
          </span>
        ))}
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
            addSkill(skillInput.trim());
          }
        }}
        maxLength={32}
        style={{marginBottom:8}}
      />
      <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
        {skillSuggestions.filter(s => !skills.includes(s) && (!skillInput || s.toLowerCase().includes(skillInput.toLowerCase()))).slice(0,6).map(s => (
          <button key={s} type="button" style={{background:'#f5f6fa',color:'#764ba2',border:'1px solid #e0e7ef',borderRadius:8,padding:'3px 10px',marginBottom:2,cursor:'pointer',fontSize:'0.98em'}} onClick={() => addSkill(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}
