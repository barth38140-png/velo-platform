// Styles globaux dans styles/repairers.css

// Carte d'affichage d'un réparateur avec infos synthétiques et bouton de contact
export const RepairerCard = ({ repairer, onContact }) => {
  const name = repairer.name || repairer.display_name || 'Réparateur';
  const skills = Array.isArray(repairer.skills) ? repairer.skills : (repairer.skills ? String(repairer.skills).split(',') : []);
  const radius = repairer.service_radius_km ?? repairer.radius_km ?? null;
  const available = repairer.is_available ?? true;
  const distanceKm = repairer.distance_km ?? repairer.distanceKm ?? null;
  const rating = repairer.rating ?? null;
  const address = repairer.location_address ?? repairer.address ?? null;

  return (
    <div className={`repairer-card ${available ? '' : 'unavailable'}`}>
      <div className="repairer-card-header">
        <div className="avatar" aria-hidden />
        <div className="title">
          <h3>{name}</h3>
          <span className="muted">
            {distanceKm != null ? `À ${Number(distanceKm).toFixed(1)} km` : radius ? `Rayon de service: ${radius} km` : ''}
            {rating != null ? ` · ⭐ ${rating}` : ''}
            {address ? ` · ${address}` : ''}
          </span>
        </div>
        <span className={`availability-badge ${available ? 'on' : 'off'}`}>{available ? 'Disponible' : 'Indisponible'}</span>
      </div>
      {repairer.bio && <p className="bio">{repairer.bio}</p>}
      {!!skills.length && (
        <div className="skills">
          {skills.map((s, i) => (
            <span key={i} className="skill-badge">{s}</span>
          ))}
        </div>
      )}
      <div className="actions">
        <button
          className="primary"
          disabled={!available}
          onClick={() => onContact?.(repairer)}
        >
          Contacter
        </button>
      </div>
    </div>
  );
};

export default RepairerCard;
