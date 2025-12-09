
// Carte compacte et moderne d'un réparateur
export const RepairerCard = ({ repairer, onContact, nextSlot, isSelected, showSkillsInline, onShowProfile, index, isFavorite, onToggleFavorite, compact }) => {
  const name = repairer.name || repairer.display_name || 'Réparateur';
  const skills = Array.isArray(repairer.skills) ? repairer.skills : (repairer.skills ? String(repairer.skills).split(',') : []);
  const available = repairer.is_available ?? true;
  const distanceKm = repairer.distance_km ?? repairer.distanceKm ?? null;
  // Créneau prochain
  let slotInfo = '';
  let slotColor = available ? '#38bdf8' : '#888';
  if (nextSlot && nextSlot.starts_at) {
    const d = new Date(nextSlot.starts_at);
    slotInfo = `Prochain créneau : ${d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })} à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    slotColor = '#38bdf8';
  } else {
    slotInfo = 'Aucun créneau disponible';
    slotColor = '#888';
  }

  // Affichage note en étoiles
  const rating = typeof repairer.rating === 'number' ? repairer.rating : null;
  const reviewsCount = repairer.reviews_count ?? repairer.nb_reviews ?? repairer.nb_avis ?? null;
  // Photo de profil si dispo
  const photo = repairer.photo_url || repairer.avatar_url || null;
  // Badge Nouveau si inscrit il y a moins de 7 jours
  let isNew = false;
  if (repairer.created_at) {
    const created = new Date(repairer.created_at);
    const now = new Date();
    isNew = (now - created) < 7*24*60*60*1000;
  }

  return (
    <div
      className={`repairer-card${isSelected ? ' selected' : ''} ${available ? '' : 'unavailable'}${compact ? ' compact' : ''}`}
      aria-label={`Réparateur ${name}${isSelected ? ' sélectionné' : ''}`}
      tabIndex={-1}
      style={{
        padding: compact ? '7px 7px' : '10px 12px',
        minHeight: compact ? 40 : 54,
        display: 'flex',
        flexDirection: compact ? 'row' : 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: compact ? 4 : 8,
        marginBottom: compact ? 6 : 10,
        background: index % 2 === 0 ? '#f8fafc' : '#fff',
        borderBottom: '1px solid #e5e7eb',
        borderRadius: 10,
        boxShadow: isSelected ? '0 0 0 2px #0ea5e9' : '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.18s',
        cursor: 'pointer',
      }}
    >
      <div style={{display:'flex',alignItems:'center',gap:compact?4:10,minWidth:0,position:'relative'}}>
        <button
          type="button"
          aria-label={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          onClick={e => { e.stopPropagation(); onToggleFavorite && onToggleFavorite(repairer); }}
          style={{
            background:'none',
            border:'none',
            padding:0,
            marginRight:6,
            cursor:'pointer',
            outline:'none',
            display:'flex',
            alignItems:'center',
            position:'relative',
            top:0
          }}
          tabIndex={0}
        >
          <span style={{fontSize:'1.3em',color:isFavorite?'#f59e42':'#cbd5e1',transition:'color 0.18s'}} aria-hidden="true">{isFavorite ? '★' : '☆'}</span>
        </button>
        {photo ? (
          <img src={photo} alt={name} style={{width:36,height:36,borderRadius:'50%',objectFit:'cover',border:isSelected?'2px solid #0ea5e9':'1.5px solid #e5e7eb'}} />
        ) : (
          <div className={`avatar${isSelected ? ' avatar-selected' : ''}`} aria-hidden style={{width:36,height:36,fontSize:'1.1em',background:'#e0e7ef',color:'#0ea5e9',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700}}>{name[0]}</div>
        )}
        {isNew && (
          <span style={{position:'absolute',top:-8,left:28,background:'#f59e42',color:'#fff',fontWeight:700,fontSize:'0.78em',padding:'2px 8px',borderRadius:8,boxShadow:'0 1px 4px #f59e4233',letterSpacing:0.5}}>Nouveau</span>
        )}
        <div style={{display:'flex',flexDirection:'column',gap:compact?0:1,minWidth:0}}>
          <span style={{fontWeight:800,fontSize:compact?'1em':'1.13em',color:'#222',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{name}</span>
          <span style={{display:'flex',alignItems:'center',gap:compact?3:6,margin:'2px 0'}}>
            <span style={{padding:compact?'1.5px 7px':'2px 10px',borderRadius:8,fontWeight:600,fontSize:compact?'0.89em':'0.93em',background:available?'#e6fbe8':'#fee2e2',color:available?'#22c55e':'#e11d48',boxShadow:available?'0 0 0 1.5px #22c55e33':'0 0 0 1.5px #e11d4833'}}>
              {available?'Disponible':'Indisponible'}
            </span>
            {distanceKm != null && <span style={{fontSize:compact?'0.89em':'0.93em',color:'#64748b'}}>{Number(distanceKm).toFixed(1)} km</span>}
          </span>
          {rating !== null && !compact && (
            <span style={{display:'flex',alignItems:'center',gap:3,fontSize:'0.98em',color:'#f59e42',fontWeight:600}}>
              {Array.from({length:5}).map((_,i)=>(
                <span key={i} style={{color:i<Math.round(rating)?'#f59e42':'#e5e7eb'}}>★</span>
              ))}
              <span style={{color:'#222',marginLeft:4}}>{rating.toFixed(1)}</span>
              {reviewsCount!=null && <span style={{color:'#64748b',marginLeft:6,fontWeight:400,fontSize:'0.95em'}}>({reviewsCount} avis)</span>}
            </span>
          )}
          {showSkillsInline && !!skills.length && (
            <div className="skills-inline" style={{marginTop:1}}>{skills.slice(0,3).map((s,i)=>(<span key={i} className="skill-badge-inline">{s}</span>))}</div>
          )}
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:2,minWidth:120}}>
        <div style={{display:'flex',gap:6}}>
          <button
            className="primary"
            disabled={!available}
            style={{opacity:available?1:0.6,minWidth:80,padding:'4px 10px',fontSize:'0.97em'}}
            tabIndex={0}
            onClick={e => {
              e.stopPropagation();
              onContact && onContact({ ...repairer, id: repairer.id || repairer.user_id });
            }}
            aria-label={`Contacter ${name}`}
          >
            <span role="img" aria-label="message" style={{marginRight:5}}>💬</span>Contacter
          </button>
          <button
            className="btn"
            style={{background:'#f1f5f9',color:'#0ea5e9',border:'none',borderRadius:8,padding:'4px 10px',fontSize:'0.97em',fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:4}}
            tabIndex={0}
            onClick={e => {
              e.stopPropagation();
              onShowProfile && onShowProfile(repairer);
            }}
            aria-label={`Détail ${name}`}
          >
            <span role="img" aria-label="loupe">🔍</span> Détail
          </button>
        </div>
        {slotInfo && (
          <div className="next-slot-info" style={{ color: slotColor, fontWeight:600, fontSize:'0.93em',marginTop:2 }}>
            <span role="img" aria-label="horloge" style={{marginRight:5}}>⏰</span>{slotInfo}
          </div>
        )}
      </div>
    </div>
  );
};

export default RepairerCard;
