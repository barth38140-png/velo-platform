import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
// Composant pour forcer le flyTo sur la carte à chaque sélection d'adresse
function FlyToHandler({ target, zoom, action }) {
  const map = useMap();
  useEffect(() => {
    if (
      target &&
      typeof target.lat === 'number' &&
      typeof target.lng === 'number' &&
      !isNaN(target.lat) &&
      !isNaN(target.lng) &&
      zoom
    ) {
      map.flyTo([target.lat, target.lng], zoom, { animate: true, duration: 1.2 });
    }
    // eslint-disable-next-line
  }, [action]);
  return null;
}
import 'leaflet/dist/leaflet.css';
import '../styles/MapPicker.css';

function MapPicker(props) {
    // Effet pour lancer le reverse geocode dès le premier render si initialPosition est fournie
    useEffect(() => {
      if (props.initialPosition && marker && typeof marker.lat === 'number' && typeof marker.lng === 'number') {
        fetchAddress(marker.lat, marker.lng);
      }
      // Ce useEffect ne dépend que de l'initialisation
      // eslint-disable-next-line
    }, []);
  // États principaux
  const [query, setQuery] = useState('');
  const [marker, setMarker] = useState(props.initialPosition || null); // Initialisé avec initialPosition si fournie
  const [shouldPan, setShouldPan] = useState(true); // Contrôle du recentrage
  const [pendingZoom, setPendingZoom] = useState(null); // Zoom à appliquer lors d'une recherche
  const [searchTarget, setSearchTarget] = useState(null); // Position à centrer lors d'une recherche
  const [flyToAction, setFlyToAction] = useState(0); // Compteur pour forcer l'effet
  const [address, setAddress] = useState('');
  const [mapZoom, setMapZoom] = useState(13);
  const [results, setResults] = useState([]);
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [hasSelected, setHasSelected] = useState(false);
  const searchRef = useRef(null);
  const { onChange, resetTrigger, initialPosition } = props;

  // À l'ouverture, on récupère la position utilisateur ou fallback Grenoble
  useEffect(() => {
    let isMounted = true;
    if (typeof resetTrigger === 'undefined') return;
    setQuery('');
    setResults([]);
    if (searchRef && searchRef.current) {
      try { searchRef.current.value = ''; } catch { /* ignore DOM access errors */ }
    }
    let fallbackTimeout;
    const fallback = () => {
      if (isMounted) {
        setMarker(props.initialPosition || { lat: 45.1885, lng: 5.7245 });
        fetchAddress((props.initialPosition || { lat: 45.1885, lng: 5.7245 }).lat, (props.initialPosition || { lat: 45.1885, lng: 5.7245 }).lng);
      }
    };
    if (navigator.geolocation) {
      fallbackTimeout = setTimeout(fallback, 2000); // 2s max d'attente
      navigator.geolocation.getCurrentPosition(pos => {
        clearTimeout(fallbackTimeout);
        if (isMounted) {
          setMarker({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          fetchAddress(pos.coords.latitude, pos.coords.longitude);
        }
      }, fallback);
    } else {
      fallback();
    }
    return () => { isMounted = false; clearTimeout(fallbackTimeout); };
  }, [resetTrigger]);

  // Effet pour centrer la carte et placer le marker lors d'une géolocalisation
  useEffect(() => {
    // Si le trigger change et qu'une position valide est fournie, on centre la carte et place le marker
    const pos = props.geolocatePosition;
    if (
      props.geolocateTrigger &&
      pos &&
      typeof pos.lat === 'number' &&
      typeof pos.lng === 'number' &&
      !isNaN(pos.lat) &&
      !isNaN(pos.lng)
    ) {
      setMarker(pos);
      setPendingZoom(16); // Zoom fort sur la position géolocalisée
      setMapZoom(16);
      setSearchTarget(pos);
      setFlyToAction(f => f + 1);
      setShouldPan(true);
      fetchAddress(pos.lat, pos.lng);
    }
    // eslint-disable-next-line
  }, [props.geolocateTrigger]);

  // Sélection sur la carte
  // Lors d'un clic sur la carte, on ne centre pas la carte
  const handleMapClick = (latlng) => {
    setMarker(latlng);
    setHasSelected(true);
    setShouldPan(false); // Désactive le recentrage
    fetchAddress(latlng.lat, latlng.lng);
  };

  // Handler pour clic sur la carte (interne)
  function MapClickHandler({ onClick }) {
    useMapEvents({
      click: (e) => {
        if (e && e.latlng) onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
    return null;
  }

  // Lors d'une recherche, on centre la carte
  const onSelectSearch = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const display = item.display_name || '';
    setPendingZoom(16); // On veut zoomer lors d'une recherche
    setMapZoom(16); // On force le zoom du MapContainer
    setSearchTarget({ lat, lng: lon }); // On stocke la cible de recherche
    setFlyToAction(f => f + 1); // Incrémente pour forcer l'effet
    setShouldPan(true); // Active le recentrage AVANT de changer le marker
    setMarker({ lat, lng: lon });
    setResults([]);
    setQuery(display);
    setAddress(display);
    if (onChange) onChange({ lat, lng: lon, address: display });
  };

  // Recherche Nominatim (auto-complétion)
  useEffect(() => {
    if (!query || query.length < 3) { setResults([]); return; }
    const ac = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(query)}`, { signal: ac.signal });
        if (!res.ok) return;
        const data = await res.json();
        setResults(data || []);
      } catch {
        // ignore
      }
    }, 350);
    return () => { clearTimeout(t); ac.abort(); };
  }, [query]);

  // Récupération adresse depuis coordonnées
  const fetchAddress = async (lat, lng) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error('Nominatim error');
      const data = await res.json();
      const display = data.display_name || '';
      setAddress(display);
      // Appel systématique du callback onChange
      if (typeof onChange === 'function') {
        onChange({ lat, lng, address: display });
      }
    } catch {
      setAddress('');
      if (typeof onChange === 'function') {
        onChange({ lat, lng, address: '' });
      }
    } finally {
      setLoadingAddr(false);
    }
  };

  // Ref pour contrôler la carte
  const mapRef = useRef();

  // Effet pour centrer la carte uniquement lors d'une recherche ou géoloc, jamais lors d'un clic utilisateur

  // Effet pour centrer/zoomer même si le marker n'a pas changé (cas recherche sur même point)

  // Effet dédié pour le centrage/zoom lors d'une recherche (toujours déclenché sur searchTarget/pendingZoom)
  useEffect(() => {
    if (mapRef.current && pendingZoom && searchTarget) {
      const map = mapRef.current;
      map.flyTo([searchTarget.lat, searchTarget.lng], pendingZoom, { animate: true, duration: 1.2 });
      setPendingZoom(null);
      setSearchTarget(null);
      setShouldPan(false);
    }
     
  }, [pendingZoom, searchTarget, flyToAction]);

  // Effet pour panTo lors d'un clic utilisateur (shouldPan true mais sans searchTarget/pendingZoom)
  useEffect(() => {
    if (mapRef.current && shouldPan && marker && !pendingZoom && !searchTarget) {
      const map = mapRef.current;
      map.panTo([marker.lat, marker.lng]);
      setShouldPan(false);
    }
  }, [shouldPan, marker, pendingZoom, searchTarget]);


  // Calcul du centre à afficher (toujours défini et valide)
  const isValidLatLng = v => v && typeof v.lat === 'number' && typeof v.lng === 'number' && !isNaN(v.lat) && !isNaN(v.lng);
  const mapCenter = isValidLatLng(marker)
    ? marker
    : isValidLatLng(props.initialPosition)
      ? props.initialPosition
      : { lat: 45.1885, lng: 5.7245 };
  // La clé doit rester constante pour éviter tout reset/recentrage de la carte
  const mapKey = 'static-map-key';

  return (
    <div className="map-picker">
      {/* Barre de recherche avec autocomplétion */}
      <div style={{marginBottom:8, textAlign:'center', position:'relative'}}>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Ville ou adresse pour centrer la carte"
          style={{width:'80%', padding:'8px', borderRadius:'6px', border:'1px solid #dfecee', margin:'0 auto'}}
          autoComplete="off"
        />
        {results.length > 0 && (
          <ul style={{position:'absolute', left:'10%', width:'80%', background:'#fff', border:'1px solid #dfecee', borderRadius:6, zIndex:1000, maxHeight:180, overflowY:'auto', margin:0, padding:0, listStyle:'none', boxShadow:'0 4px 16px rgba(0,0,0,0.12)'}}>
            {results.map(item => (
              <li key={item.place_id} style={{padding:'8px', cursor:'pointer'}} onClick={() => onSelectSearch(item)}>
                {item.display_name}
              </li>
            ))}
          </ul>
        )}
        <small className="micro" style={{color:'#888', display:'block', marginTop:4}}>Cliquez sur la carte pour sélectionner le lieu précis.</small>
      </div>
      {/* Carte Leaflet toujours affichée */}
      <MapContainer
        key={mapKey}
        center={mapCenter}
        zoom={mapZoom}
        style={{ height: '300px', width: '100%' }}
        whenCreated={mapInstance => { mapRef.current = mapInstance; }}
      >
        {/* Force le flyTo à chaque sélection d'adresse */}
        <FlyToHandler target={searchTarget} zoom={pendingZoom} action={flyToAction} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapClickHandler onClick={handleMapClick} />
        {isValidLatLng(marker) && <Marker position={marker} />}
      </MapContainer>
      {/* Affichage de l'adresse récupérée */}
      <div style={{textAlign:'center', marginTop:'10px'}}>
        <span data-testid="address-display" style={{color:'#1976d2', fontWeight:500}}>{address}</span>
      </div>
      {/* Bouton de confirmation de la position */}
      <div style={{textAlign:'center', marginTop:'12px'}}>
        <button
          type="button"
          onClick={() => {
            if (onChange && isValidLatLng(marker)) {
              onChange({ lat: marker.lat, lng: marker.lng, address });
            }
          }}
          aria-label="Confirmer la position"
        >
          Confirmer la position
        </button>
      </div>
    </div>
  );
}

export default MapPicker;


