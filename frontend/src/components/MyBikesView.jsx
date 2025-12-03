import React, { useEffect, useState } from 'react';
import { bikeService } from '../services/api';
import AddBikePage from './AddBikePage';
import '../styles/MyBikesView.css';

export default function MyBikesView({ resetSignal }) {
  const [bikes, setBikes] = useState([]);
  const [selectedBike, setSelectedBike] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    let cancelled = false;
    bikeService.getMyBikes().then(res => {
      const list = res && Array.isArray(res.bikes) ? res.bikes : [];
      if (!cancelled) setBikes(list);
    }).catch(() => setBikes([]));
    return () => { cancelled = true; };
  }, []);

  // Reset to list view when external resetSignal changes (nav click)
  useEffect(() => {
    setShowAdd(false);
    setSelectedBike(null);
    setIsEditing(false);
  }, [resetSignal]);

  // Refetch bikes list on every resetSignal (tab click) to ensure fresh data
  useEffect(() => {
    if (resetSignal === undefined) return; // safeguard
    let cancelled = false;
    bikeService.getMyBikes().then(res => {
      const list = res && Array.isArray(res.bikes) ? res.bikes : [];
      if (!cancelled) setBikes(list);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [resetSignal]);

  const handleGoToMyBikes = () => {
    // Reset to initial state: list + actions + empty add form
    setSelectedBike(null);
    setIsEditing(false);
  };

  // View action removed per request; keep edit/delete only

  const handleEdit = (bike) => {
    setSelectedBike(bike);
    setIsEditing(true);
  };

  const handleDelete = async (bike) => {
    try {
      await bikeService.deleteBike(bike.id);
      setBikes(prev => prev.filter(b => b.id !== bike.id));
      if (selectedBike?.id === bike.id) {
        setSelectedBike(null);
        setIsEditing(false);
      }
    } catch (e) {
      // Optionally handle error via toast
    }
  };

  // When adding, hide list & components: show only form
  if (showAdd) {
    return (
      <div className="my-bikes-page">
        <AddBikePage
          conversational
          bike={null}
          onClose={() => {
            setShowAdd(false);
            setSelectedBike(null);
            setIsEditing(false);
            bikeService.getMyBikes().then(res => {
              const list = res && Array.isArray(res.bikes) ? res.bikes : [];
              setBikes(list);
            }).catch(() => {});
          }}
        />
      </div>
    );
  }

  // When editing a bike, show full details form (AddBikePage in edit mode)
  if (isEditing && selectedBike) {
    return (
      <div className="my-bikes-page">
        <AddBikePage
          bike={selectedBike}
          conversational
          startEditing
          onClose={() => {
            setIsEditing(false);
            setSelectedBike(null);
            bikeService.getMyBikes().then(res => {
              const list = res && Array.isArray(res.bikes) ? res.bikes : [];
              setBikes(list);
            }).catch(() => {});
          }}
        />
      </div>
    );
  }

  return (
    <div className="my-bikes-page">
      <header style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
        <h3 style={{margin:0}}>Mes vélos</h3>
      </header>
      <section className="bikes-list">
        <ul className="bike-items">
          {bikes.map(b => (
            <li key={b.id}>
              <div className="bike-card">
                {(function(){
                  const name = b.name || '';
                  const hasBrandModel = !!(b.brand || b.model);
                  let title = '';
                  if (hasBrandModel) {
                    title = `${b.brand || ''} ${b.model || ''}`.trim();
                  } else if (name) {
                    title = name;
                  } else {
                    title = '—';
                  }
                  const metaParts = [];
                  if (b.type) metaParts.push(b.type);
                  if (b.wheel_size) metaParts.push(`Roues ${b.wheel_size}`);
                  if (b.frame_size) metaParts.push(`Taille ${b.frame_size}`);
                  const meta = metaParts.join(' • ');
                  return (
                    <div className="card-header">
                      <div className="card-title">{title}</div>
                      {meta && <div className="card-meta">{meta}</div>}
                    </div>
                  );
                })()}
                <div className="bike-info">
                  {Array.isArray(b.colors) ? (
                    <div className="line"><strong>Couleur:</strong> {b.colors.length ? b.colors.join(', ') : '—'}</div>
                  ) : null}
                  {b.serial_number ? (
                    <div className="line"><strong>N° série:</strong> {b.serial_number}</div>
                  ) : null}
                  {typeof b.year === 'number' ? (
                    <div className="line"><strong>Année:</strong> {b.year}</div>
                  ) : null}
                </div>
                <div className="bike-actions">
                  <button className="btn" onClick={() => handleEdit(b)}>Modifier</button>
                  <button className="btn danger" onClick={() => handleDelete(b)}>Supprimer</button>
                </div>
              </div>
            </li>
          ))}
          {/* Add-bike card at the end, styled similarly but distinct */}
          <li>
            <div className="bike-card add">
              <div className="card-header">
                <div className="card-title">Ajouter un vélo</div>
              </div>
              <div className="bike-actions">
                <button className="btn primary" onClick={() => { setSelectedBike(null); setIsEditing(false); setShowAdd(true); }}>Ouvrir le formulaire</button>
              </div>
            </div>
          </li>
          {bikes.length === 0 && (
            <li className="empty">Aucun vélo pour l’instant.</li>
          )}
        </ul>
      </section>

      {/* Edit mode handled above with full details form */}
    </div>
  );
}
