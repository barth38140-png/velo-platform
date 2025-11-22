import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/MapPicker.css';

// Fix default icon paths for Vite bundling
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng);
    }
  });
  return null;
}

export default function MapPicker({ initialPosition = { lat: 48.8566, lng: 2.3522 }, onChange, resetTrigger, showConfirm = true, showAddress = true, showSearch = true, showCoords = true }) {
  const [marker, setMarker] = useState(initialPosition);
  const [address, setAddress] = useState('');
  const [loadingAddr, setLoadingAddr] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const searchRef = useRef(null);

  // explicit default icon to avoid missing/broken marker images
  const defaultIcon = L.icon({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41]
  });

  useEffect(() => {
    // reverse geocode initial position
    fetchAddress(marker.lat, marker.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelect = (latlng) => {
    setMarker(latlng);
    fetchAddress(latlng.lat, latlng.lng);
  };

  const onSelectSearch = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const display = item.display_name || '';
    setMarker({ lat, lng: lon });
    setResults([]);
    setQuery(display);
    setAddress(display);
    if (onChange) onChange({ lat, lng: lon, address: display });
  };

  // search Nominatim
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

  const fetchAddress = async (lat, lng) => {
    setLoadingAddr(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (!res.ok) throw new Error('Nominatim error');
      const data = await res.json();
      const display = data.display_name || '';
      setAddress(display);
      if (onChange) onChange({ lat, lng, address: display });
    } catch {
      setAddress('');
      if (onChange) onChange({ lat, lng, address: '' });
    } finally {
      setLoadingAddr(false);
    }
  };

  // Allow parent to request a reset of the picker (clears marker/address and re-fetches initial address)
  useEffect(() => {
    if (typeof resetTrigger === 'undefined') return;
    setMarker(initialPosition);
    setQuery('');
    setResults([]);
    if (searchRef && searchRef.current) {
      try { searchRef.current.value = ''; } catch { /* ignore DOM access errors */ }
    }
    fetchAddress(initialPosition.lat, initialPosition.lng);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetTrigger]);

  return (
    <div className="map-picker">
      {showSearch && (
        <div className="map-search">
          <input data-cy="map-search-input" ref={searchRef} placeholder="Rechercher une adresse..." value={query} onChange={(e) => setQuery(e.target.value)} />
          {results && results.length > 0 && (
            <ul className="map-search-results" data-cy="map-search-results">
              {results.slice(0, 8).map((r, i) => (
                <li key={i} data-cy={`map-search-result-${i}`} onClick={() => onSelectSearch(r)}>
                  {r.display_name}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
      <MapContainer center={[marker.lat, marker.lng]} zoom={13} style={{ height: 300, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onSelect={onSelect} />
        {marker && <Marker position={[marker.lat, marker.lng]} icon={defaultIcon} />}
      </MapContainer>

      <div className="map-picker-meta">
        {showCoords && (
          <div className="coords">Lat: {marker.lat.toFixed(6)}, Lng: {marker.lng.toFixed(6)}</div>
        )}
        {showAddress && (
          <div className="address">{loadingAddr ? 'Recherche d\'adresse...' : (address || 'Adresse non trouvée')}</div>
        )}
        {showConfirm && (
          <button data-cy="map-pick-confirm" type="button" className="btn primary" onClick={() => onChange && onChange({ lat: marker.lat, lng: marker.lng, address })}>Confirmer la position</button>
        )}
      </div>
    </div>
  );
}
