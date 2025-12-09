import { useEffect, useState, memo, useCallback } from 'react';
import { availabilityService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lundi = 1
  return new Date(d.setDate(diff));
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDay(date) {
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function formatHour(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function RepairerAvailability() {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()));
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  // Pour sélection dynamique sur l'agenda
  const [selecting, setSelecting] = useState(null); // { day: Date, hour: string } ou null
  const [selection, setSelection] = useState(null); // { start: Date, end: Date } ou null
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    if (!user || !user.id) return;
    setLoading(true);
    try {
      const slots = await availabilityService.list(user.id);
      // On garde tous les créneaux pour l'agenda
      setSlots(slots.sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [user]);

  async function handleCreate(e) {
    if (e) e.preventDefault();
    setError('');
    let start, end;
    if (selection) {
      start = selection.start;
      end = selection.end;
    } else {
      if (!startsAt || !endsAt) {
        setError('Veuillez renseigner une date de début et de fin.');
        return;
      }
      start = new Date(startsAt);
      end = new Date(endsAt);
    }
    try {
      const startsAtIso = new Date(start).toISOString();
      const endsAtIso = new Date(end).toISOString();
      const slot = await availabilityService.create(startsAtIso, endsAtIso);
      setSlots(prev => [...prev, slot].sort((a,b)=> new Date(a.starts_at)-new Date(b.starts_at)));
      setStartsAt(''); setEndsAt('');
      setSelection(null); setSelecting(null);
    } catch (e) {
      if (e?.response?.data?.error && e.response.data.error.includes('chevauchement')) {
        setError('Ce créneau chevauche un créneau existant. Merci de choisir une autre période.');
      } else {
        setError('Erreur lors de la création du créneau. Merci de vérifier vos dates ou de réessayer plus tard.');
      }
      // Utiliser le logger Pino côté backend pour les erreurs API
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

  // Construction de la semaine à afficher
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Créneaux de la semaine courante
  const weekSlots = slots.filter(s => {
    const start = new Date(s.starts_at);
    const end = new Date(s.ends_at);
    return days.some(day => {
      const d = new Date(day);
      d.setHours(0,0,0,0);
      return (start <= addDays(d,1) && end >= d);
    });
  });

  // Plage horaire personnalisable
  const [hourStart, setHourStart] = useState(8);
  const [hourEnd, setHourEnd] = useState(20);
  const hours = Array.from({length: hourEnd-hourStart+1}, (_,i)=> hourStart+i);

  // Sous-composant pour une colonne jour (optimisé)
  const HourCell = memo(function HourCell({ day, hour, cellSlots, isSelecting, isSelected, handleCellClick }) {
    return (
      <div
        style={{
          position: 'relative',
          height: 32,
          margin: '2px 0',
          cursor: cellSlots.length === 0 && !isSelected && !isSelecting ? 'pointer' : 'default',
          background: isSelected ? '#bbdefb' : isSelecting ? '#90caf9' : 'transparent',
          borderRadius: 6,
          border: isSelected ? '1.5px solid #1976d2' : '1px solid #e0e0e0',
          zIndex: 1
        }}
        onClick={() => cellSlots.length === 0 ? handleCellClick(day, hour) : null}
      >
        {cellSlots.length === 0 && !isSelected && !isSelecting && hour === 8 && (
          <div style={{ color: '#bbb', fontSize: '0.97em', marginTop: 4 }}>—</div>
        )}
      </div>
    );
  });

  const DayColumn = memo(function DayColumn({ day, dayIdx, weekSlots, hours, selection, handleCellClick, handleDelete }) {
    // Créneaux du jour (portion du créneau si multi-jours, gestion UTC/locale)
    const daySlots = weekSlots.filter(s => {
      const sStart = new Date(s.starts_at);
      const sEnd = new Date(s.ends_at);
      // On compare en local : on prend le jour local de la colonne et on regarde si le créneau recouvre ce jour
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
      return sStart <= dayEnd && sEnd >= dayStart;
    });
    return (
      <div style={{minHeight:80,padding:'0 2px',position:'relative'}}>
        {/* Blocs créneaux positionnés (portion du créneau sur ce jour) */}
        {daySlots.map(s => {
          const sStart = new Date(s.starts_at);
          const sEnd = new Date(s.ends_at);
          // Début/fin du bloc sur ce jour (en local)
          const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 8, 0, 0, 0);
          const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 20, 0, 0, 0);
          const blockStart = sStart > dayStart ? sStart : dayStart;
          const blockEnd = sEnd < dayEnd ? sEnd : dayEnd;
          let startHour = blockStart.getHours() + blockStart.getMinutes()/60;
          let endHour = blockEnd.getHours() + blockEnd.getMinutes()/60;
          // Clamp to agenda hours
          startHour = Math.max(8, startHour);
          endHour = Math.min(20, endHour);
          if (endHour <= startHour) return null;
          const top = ((startHour-8)*34);
          const height = Math.max(32, (endHour-startHour)*34);
          return (
            <div key={s.id+dayIdx} style={{position:'absolute',left:2,right:2,top:top,bottom:'auto',height:height,background:'#e8f5e9',border:'2px solid #388e3c',borderRadius:8,padding:'4px 8px',fontSize:'0.97em',color:'#388e3c',display:'flex',alignItems:'center',justifyContent:'space-between',zIndex:3,boxShadow:'0 2px 8px #0001'}}>
              <span style={{fontWeight:600}}>{formatHour(blockStart)} - {formatHour(blockEnd)}</span>
              <button className="btn danger small" style={{fontSize:'0.97em'}} onClick={()=>{if(window.confirm('Supprimer ce créneau ?'))handleDelete(s.id);}}>Supprimer</button>
            </div>
          );
        })}
        {/* Sélection dynamique affichée */}
        {selection && selection.start && !selection.end &&
          (selection.start.getDate() === day.getDate() && selection.start.getMonth() === day.getMonth() && selection.start.getFullYear() === day.getFullYear()) && (
          <div style={{position:'absolute',left:2,right:2,top:((selection.start.getHours()-8)*34),height:34,background:'#90caf9',border:'2px dashed #1976d2',borderRadius:8,opacity:0.7,zIndex:2}}></div>
        )}
        {selection && selection.start && selection.end &&
          (selection.start.getDate() === day.getDate() && selection.start.getMonth() === day.getMonth() && selection.start.getFullYear() === day.getFullYear()) && (
          <div style={{position:'absolute',left:2,right:2,top:((selection.start.getHours()-8)*34),height:Math.max(32,((selection.end.getHours()+selection.end.getMinutes()/60)-(selection.start.getHours()+selection.start.getMinutes()/60))*34),background:'#bbdefb',border:'2px solid #1976d2',borderRadius:8,opacity:0.7,zIndex:2}}></div>
        )}
        {/* Cases horaires cliquables */}
        {hours.map(hour => {
          const cellStart = new Date(day);
          cellStart.setHours(hour, 0, 0, 0);
          const cellEnd = new Date(day);
          cellEnd.setHours(hour + 1, 0, 0, 0);
          const cellSlots = weekSlots.filter(s => {
            const sStart = new Date(s.starts_at);
            const sEnd = new Date(s.ends_at);
            return (sStart < cellEnd && sEnd > cellStart);
          });
          let isSelecting = false;
          if (selection && selection.start && !selection.end) {
            const selStart = selection.start;
            isSelecting = selStart.getTime() === cellStart.getTime();
          }
          let isSelected = false;
          if (selection && selection.start && selection.end) {
            isSelected = (cellStart >= selection.start && cellEnd <= selection.end);
          }
          return (
            <HourCell
              key={hour}
              day={day}
              hour={hour}
              cellSlots={cellSlots}
              isSelecting={isSelecting}
              isSelected={isSelected}
              handleCellClick={handleCellClick}
            />
          );
        })}
      </div>
    );
  });

  // Pour revenir à la semaine courante
  function goToToday() {
    setWeekStart(startOfWeek(new Date()));
  }

  // Gestion de la sélection dynamique
  function handleCellClick(day, hour) {
    const date = new Date(day);
    date.setHours(hour,0,0,0);
    if (!selecting) {
      setSelecting({ day, hour });
      setSelection({ start: date, end: null });
    } else if (selecting) {
      // Second clic : fin
      const startDate = new Date(selection.start);
      const endDate = new Date(day);
      endDate.setHours(hour+1,0,0,0);
      if (endDate > startDate) {
        setSelection({ start: startDate, end: endDate });
        setSelecting(null);
      } else {
        // Si clic avant le début, recommencer
        setSelecting(null);
        setSelection(null);
      }
    }
  }

  return (
    <div className="container" style={{maxWidth:900,margin:'0 auto',padding:'24px 0'}}>
      <h2 style={{marginBottom:18,fontWeight:700,fontSize:'1.4rem'}}>🗓️ Mes disponibilités (vue agenda)</h2>
      {/* Formulaire classique masqué si sélection dynamique en cours */}
      {!selection && (
        <form onSubmit={handleCreate} style={{ display:'flex', gap:12, alignItems:'flex-end', background:'#f8f9fa', borderRadius:10, padding:'16px 18px', boxShadow:'0 1px 4px #0001', marginBottom:18 }}>
          <div style={{flex:1}}>
            <label htmlFor="start-dt" style={{fontWeight:600,display:'block',marginBottom:4}}>Début</label>
            <input id="start-dt" type="datetime-local" value={startsAt} onChange={e=>setStartsAt(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #dfecee'}} />
          </div>
          <div style={{flex:1}}>
            <label htmlFor="end-dt" style={{fontWeight:600,display:'block',marginBottom:4}}>Fin</label>
            <input id="end-dt" type="datetime-local" value={endsAt} onChange={e=>setEndsAt(e.target.value)} style={{width:'100%',padding:8,borderRadius:6,border:'1px solid #dfecee'}} />
          </div>
          <button type="submit" className="btn primary" style={{padding:'10px 18px',fontWeight:600}}>Ajouter</button>
          {error && <div style={{color:'#b00020',marginTop:8,marginBottom:-8,fontSize:'0.98em'}}>{error}</div>}
        </form>
      )}
      {/* Sélection dynamique affichée */}
      {selection && selection.start && selection.end && (
        <div style={{background:'#e3f2fd',border:'1px solid #90caf9',borderRadius:8,padding:'12px 18px',marginBottom:16,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div>
            <b>Nouveau créneau :</b> {selection.start.toLocaleString()} → {selection.end.toLocaleString()}
          </div>
          <div>
            <button className="btn primary" style={{marginRight:8}} onClick={handleCreate}>Valider</button>
            <button className="btn" onClick={()=>{setSelection(null);setSelecting(null);}}>Annuler</button>
          </div>
        </div>
      )}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12,gap:8,flexWrap:'wrap'}}>
        <button className="btn" style={{fontWeight:600}} onClick={()=>setWeekStart(addDays(weekStart,-7))}>⏪ Semaine précédente</button>
        <button className="btn" style={{fontWeight:600}} onClick={goToToday}>Aujourd'hui</button>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <label htmlFor="hourStart" style={{fontWeight:600}}>Début&nbsp;:</label>
          <select id="hourStart" value={hourStart} onChange={e=>setHourStart(Number(e.target.value))}>
            {Array.from({length: 24}, (_,i)=>i).map(h=>(<option key={h} value={h}>{h}h</option>))}
          </select>
          <label htmlFor="hourEnd" style={{fontWeight:600}}>Fin&nbsp;:</label>
          <select id="hourEnd" value={hourEnd} onChange={e=>setHourEnd(Number(e.target.value))}>
            {Array.from({length: 24}, (_,i)=>i).map(h=>(<option key={h} value={h}>{h}h</option>))}
          </select>
        </div>
        <div style={{fontWeight:600,fontSize:'1.1em',flex:1,textAlign:'center'}}>
          Semaine du {days[0].toLocaleDateString('fr-FR')} au {days[6].toLocaleDateString('fr-FR')}
        </div>
        <button className="btn" style={{fontWeight:600}} onClick={()=>setWeekStart(addDays(weekStart,7))}>Semaine suivante ⏩</button>
      </div>
      <div style={{overflowX:'auto',background:'#f8f9fa',borderRadius:10,padding:'12px 0',boxShadow:'0 1px 4px #0001',minWidth:700}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2}}>
          {days.map((day,i)=>(
            <div key={i} style={{textAlign:'center',fontWeight:600,padding:'6px 0',borderBottom:'2px solid #1976d2',background:'#e3f2fd'}}>{formatDay(day)}</div>
          ))}
        </div>
        {/* Grille agenda : heures en lignes, jours en colonnes */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:2,position:'relative',minHeight:hours.length*34}}>
          {days.map((day, dayIdx) => (
            <DayColumn key={dayIdx} day={day} dayIdx={dayIdx} weekSlots={weekSlots} hours={hours} selection={selection} handleCellClick={handleCellClick} handleDelete={handleDelete} />
          ))}
        </div>
        {/* Légende heures */}
        <div style={{display:'flex',marginTop:8}}>
          {hours.map(h=>(<div key={h} style={{flex:1,textAlign:'center',fontSize:'0.95em',color:'#888'}}>{h}h</div>))}
        </div>
      </div>
      {loading && <div className="loader-sm" style={{margin:'24px 0',fontWeight:600,fontSize:'1.1em',color:'#1976d2'}}>Chargement des créneaux…</div>}
      {!loading && weekSlots.length === 0 && (
        <div style={{background:'#fffbe6',border:'1px solid #ffe082',borderRadius:8,padding:'16px',color:'#8a6d1b',textAlign:'center',fontSize:'1.05em',marginTop:16}}>Aucun créneau cette semaine.<br/>Ajoutez vos créneaux pour être visible auprès des clients.</div>
      )}
    </div>
  );
}

export default RepairerAvailability;
