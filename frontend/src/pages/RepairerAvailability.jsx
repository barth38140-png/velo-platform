import { useEffect, useState } from 'react';
import { availabilityService } from '../services/api';

export default function RepairerAvailability() {
  const [slots, setSlots] = useState([]);
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [loading, setLoading] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      // Lister mes créneaux via statut free/reserved
      const now = new Date();
      const from = new Date(now.getTime() - 24*3600*1000).toISOString();
      const to = new Date(now.getTime() + 14*24*3600*1000).toISOString();
      // On ne connaît pas mon repairerId côté frontend; API retourne mes slots via auth sur POST, mais GET attend un id
      // Pour MVP, demander l’id via un champ input ou ignorer (à intégrer avec contexte auth)
      // Ici, on affiche seulement après création/suppression locales
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    if (!startsAt || !endsAt) return;
    try {
      const slot = await availabilityService.create(startsAt, endsAt);
      setSlots(prev => [...prev, slot].sort((a,b)=> new Date(a.starts_at)-new Date(b.starts_at)));
      setStartsAt(''); setEndsAt('');
    } catch (e) {
      alert('Erreur lors de la création du créneau');
    }
  }

  async function handleDelete(slotId) {
    try {
      await availabilityService.remove(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (e) {
      alert('Erreur lors de la suppression du créneau');
    }
  }

  return (
    <div className="container">
      <h2>Mes disponibilités</h2>
      <form onSubmit={handleCreate} style={{ display:'flex', gap:8, alignItems:'center' }}>
        <label>Début
          <input type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} />
        </label>
        <label>Fin
          <input type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} />
        </label>
        <button type="submit">Ajouter</button>
      </form>
      <div style={{ marginTop:16 }}>
        {loading ? <p>Chargement…</p> : (
          <table>
            <thead>
              <tr><th>Début</th><th>Fin</th><th>Statut</th><th>Action</th></tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.starts_at).toLocaleString()}</td>
                  <td>{new Date(s.ends_at).toLocaleString()}</td>
                  <td>{s.status}</td>
                  <td><button onClick={()=>handleDelete(s.id)}>Supprimer</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
