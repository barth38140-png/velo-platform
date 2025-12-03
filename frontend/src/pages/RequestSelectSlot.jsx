import { useEffect, useState } from 'react';
import { availabilityService } from '../services/api';

export default function RequestSelectSlot({ repairRequestId, repairerId, onReserved }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  async function refresh() {
    if (!repairerId) return;
    setLoading(true);
    try {
      const params = {};
      if (from) params.from = new Date(from).toISOString();
      if (to) params.to = new Date(to).toISOString();
      params.status = 'free';
      const rows = await availabilityService.list(repairerId, params);
      setSlots(rows);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [repairerId, from, to]);

  async function reserve(slotId) {
    try {
      const res = await availabilityService.reserve(slotId, repairerId, repairRequestId);
      if (onReserved) onReserved(res);
      // retirer le slot de la liste
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (e) {
      alert('Erreur lors de la réservation du créneau');
    }
  }

  return (
    <div>
      <h3>Choisir un créneau</h3>
      <div style={{ display:'flex', gap:8 }}>
        <label>De
          <input type="datetime-local" value={from} onChange={e=>setFrom(e.target.value)} />
        </label>
        <label>À
          <input type="datetime-local" value={to} onChange={e=>setTo(e.target.value)} />
        </label>
        <button onClick={refresh}>Rechercher</button>
      </div>
      {loading ? <p>Chargement…</p> : (
        <ul>
          {slots.map(s => (
            <li key={s.id} style={{ display:'flex', gap:12, alignItems:'center' }}>
              <span>{new Date(s.starts_at).toLocaleString()} → {new Date(s.ends_at).toLocaleString()}</span>
              <button onClick={()=>reserve(s.id)}>Réserver</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
