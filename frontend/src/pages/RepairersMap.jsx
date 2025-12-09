import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useMemo, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Icônes personnalisées
const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Vue carte des réparateurs
export default function RepairersMap({ repairers, selectedRepairerId, onSelectRepairer, onShowProfile }) {
  const navigate = useNavigate();
  // Centrage sur Grenoble par défaut
  const [userPosition, setUserPosition] = useState(null);
  const [geoError, setGeoError] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserPosition([pos.coords.latitude, pos.coords.longitude]);
        },
        err => {
          let msg = "Impossible d'obtenir votre position géographique.";
          if (err.code === 1) msg = "Accès à la géolocalisation refusé.";
          if (err.code === 2) msg = "Position géographique indisponible.";
          if (err.code === 3) msg = "La demande de géolocalisation a expiré.";
          setGeoError(msg);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const center = useMemo(() => {
    if (userPosition) return userPosition;
    if (!repairers?.length) return [45.1885, 5.7245];
    // Moyenne des positions
    const lats = repairers.map(r => r.location_lat).filter(Boolean);
    const lngs = repairers.map(r => r.location_lng).filter(Boolean);
    if (!lats.length || !lngs.length) return [45.1885, 5.7245];
    return [
      lats.reduce((a, b) => a + b, 0) / lats.length,
      lngs.reduce((a, b) => a + b, 0) / lngs.length
    ];
  }, [repairers, userPosition]);

  // Icône verte pour l'utilisateur
  const userIcon = greenIcon;

  return (
    <div style={{height:'100%',width:'100%',background:'#fff',borderRadius:'12px',boxShadow:'0 2px 8px rgba(0,0,0,0.07)',overflow:'hidden',position:'relative'}}>
      {geoError && (
        <div style={{position:'absolute',top:18,left:18,zIndex:1001,background:'#fee2e2',color:'#b91c1c',padding:'10px 18px',borderRadius:10,fontWeight:500,fontSize:'1em',boxShadow:'0 2px 8px rgba(0,0,0,0.08)'}}>
          {geoError}
        </div>
      )}
      <MapWithFitBounds
        userPosition={userPosition}
        repairers={repairers}
        selectedRepairerId={selectedRepairerId}
        onSelectRepairer={onSelectRepairer}
        onShowProfile={onShowProfile}
      />
    </div>
  );
}

// Composant qui centre la carte sur l'utilisateur et le réparateur sélectionné
function FitBoundsOnSelection({ userPosition, repairers, selectedRepairerId }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    if (!selectedRepairerId || !userPosition) return;
    const selected = repairers.find(r => (r.id || r.user_id) === selectedRepairerId);
    if (!selected || !selected.location_lat || !selected.location_lng) return;
    const bounds = L.latLngBounds([
      [userPosition[0], userPosition[1]],
      [selected.location_lat, selected.location_lng]
    ]);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
  }, [selectedRepairerId, userPosition, repairers, map]);
  return null;
}

// Composant séparé pour gérer le fitBounds et le zIndexOffset
function MapWithFitBounds({ userPosition, repairers, selectedRepairerId, onSelectRepairer, onShowProfile }) {
  const mapRef = useRef();
  const map = mapRef.current;
  // ...existing code...

  // Icône verte pour l'utilisateur
  const userIcon = greenIcon;

  return (
    <MapContainer
      center={userPosition || [45.1885, 5.7245]}
      zoom={12}
      style={{height:'100%',width:'100%'}}
      scrollWheelZoom={true}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBoundsOnSelection userPosition={userPosition} repairers={repairers} selectedRepairerId={selectedRepairerId} />
      {/* Marqueur utilisateur (vert) */}
      {userPosition && (
        <Marker position={userPosition} icon={userIcon} zIndexOffset={800}>
          <Popup>
            <b>Vous êtes ici</b>
          </Popup>
        </Marker>
      )}
      {/* Marqueurs réparateurs (bleu ou rouge si sélectionné) */}
      {repairers.length === 0 && (
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',background:'#fff',padding:'18px 32px',borderRadius:12,boxShadow:'0 2px 8px rgba(0,0,0,0.08)',zIndex:1000,fontSize:'1.1em',color:'#64748b'}}>
          Aucun réparateur à afficher sur la carte.
        </div>
      )}
      {(() => {
        // Regrouper les réparateurs par position (arrondi à 5 décimales)
        const posMap = {};
        repairers.filter(r => r.location_lat && r.location_lng).forEach(r => {
          const key = `${Number(r.location_lat).toFixed(5)},${Number(r.location_lng).toFixed(5)}`;
          if (!posMap[key]) posMap[key] = [];
          posMap[key].push(r);
        });
        // Générer les marqueurs avec offset si besoin
        const markers = [];
        Object.entries(posMap).forEach(([key, group]) => {
          if (group.length === 1) {
            const r = group[0];
            const id = r.id || r.user_id;
            const isSelected = selectedRepairerId && id === selectedRepairerId;
            markers.push(
              <Marker
                key={id}
                position={[r.location_lat, r.location_lng]}
                icon={isSelected ? redIcon : blueIcon}
                zIndexOffset={isSelected ? 1000 : 500}
                eventHandlers={{
                  click: () => {
                    if (onSelectRepairer) onSelectRepairer(id);
                  },
                  mouseover: (e) => {
                    e.target.setZIndexOffset(1200);
                  },
                  mouseout: (e) => {
                    e.target.setZIndexOffset(isSelected ? 1000 : 500);
                  }
                }}
                title={r.name || r.display_name || 'Réparateur'}
              >
                <Popup>
                  <div style={{minWidth:110,padding:'4px 0'}}>
                    <b style={{fontSize:'1em'}}>{r.name || r.display_name || 'Réparateur'}</b><br/>
                    <span style={{color:'#0ea5e9',fontWeight:500,fontSize:'0.97em'}}>{r.skills?.join(', ')}</span><br/>
                    {r.bio && <span style={{fontSize:'0.93em',color:'#555'}}>{r.bio}</span>}<br/>
                    <button className="btn" style={{marginTop:6,fontSize:'0.97em',padding:'4px 12px'}} onClick={() => onShowProfile && onShowProfile(r)}>Détail</button>
                  </div>
                </Popup>
              </Marker>
            );
          } else {
            // Plusieurs réparateurs sur la même position : appliquer un offset circulaire
            const baseLat = Number(group[0].location_lat);
            const baseLng = Number(group[0].location_lng);
            const radius = 0.00018; // ~20m
            group.forEach((r, i) => {
              const angle = (2 * Math.PI * i) / group.length;
              const lat = baseLat + Math.cos(angle) * radius;
              const lng = baseLng + Math.sin(angle) * radius;
              const id = r.id || r.user_id;
              const isSelected = selectedRepairerId && id === selectedRepairerId;
              markers.push(
                <Marker
                  key={id}
                  position={[lat, lng]}
                  icon={isSelected ? redIcon : blueIcon}
                  zIndexOffset={isSelected ? 1000 : 500}
                  eventHandlers={{
                    click: () => {
                      if (onSelectRepairer) onSelectRepairer(id);
                    }
                  }}
                >
                  <Popup>
                    <div style={{minWidth:120}}>
                      <b style={{fontSize:'1.1em'}}>{r.name || r.display_name || 'Réparateur'}</b><br/>
                      <span style={{color:'#0ea5e9',fontWeight:500}}>{r.skills?.join(', ')}</span><br/>
                      {r.bio && <span style={{fontSize:'0.95em',color:'#555'}}>{r.bio}</span>}<br/>
                      {/* Bouton 'Sélectionner' supprimé car la sélection se fait déjà par clic */}
                    </div>
                  </Popup>
                </Marker>
              );
            });
          }
        });
        return markers;
      })()}
    </MapContainer>
  );
}
