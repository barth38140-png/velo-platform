import React, { useState } from 'react';
// Fonction utilitaire pour géolocaliser et centrer la carte
function useGeolocate(onLocate) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const locate = () => {
    setLoading(true);
    setError(null);
    if (!navigator.geolocation) {
      setError('La géolocalisation n\'est pas supportée.');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLoading(false);
        onLocate({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
      },
      err => {
        setError('Impossible de récupérer la position.');
        setLoading(false);
      }
    );
  };
  return { locate, loading, error };
}
import MapPicker from './MapPicker';

export default function LocationSelector({ initial = {}, onChange }) {
  const [query, setQuery] = useState('');
  const [geolocateTrigger, setGeolocateTrigger] = useState(0);
  const [geolocatePosition, setGeolocatePosition] = useState(null);
  const [lastAddress, setLastAddress] = useState(initial.locationAddress || '');

  const { locate, loading, error } = useGeolocate(async ({ lat, lng }) => {
    // On effectue un reverse geocoding pour obtenir l'adresse
    let address = '';
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`);
      if (res.ok) {
        const data = await res.json();
        address = data.display_name || '';
      }
    } catch {}
    // On force la mise à jour de la carte et du marker
    setGeolocatePosition({ lat, lng });
    setGeolocateTrigger(t => t + 1);
    setLastAddress(address);
    onChange && onChange({ locationLat: lat, locationLng: lng, locationAddress: address, precise: '' });
  });

  const handleMapChange = (pos) => {
    const payload = { locationLat: pos.lat, locationLng: pos.lng, locationAddress: pos.address, precise: '' };
    setLastAddress(pos.address || '');
    onChange && onChange(payload);
  };

  // Détermine la position à passer à MapPicker (géoloc prioritaire, sinon initial)
  const mapPickerPosition = geolocatePosition
    ? geolocatePosition
    : ((typeof initial.locationLat === 'number' && !isNaN(initial.locationLat) && typeof initial.locationLng === 'number' && !isNaN(initial.locationLng))
      ? { lat: initial.locationLat, lng: initial.locationLng }
      : { lat: 45.1885, lng: 5.7245 });

  return (
    <div className="location-selector modern-form" style={{padding:'12px 0'}}>
      <label className="label">Rechercher par ville ou code postal</label>
      <MapPicker
        initialPosition={mapPickerPosition}
        onChange={(p) => handleMapChange({ lat: p.lat, lng: p.lng, address: p.address })}
        geolocateTrigger={geolocateTrigger}
        geolocatePosition={geolocatePosition}
        showSearch={true}
        showConfirm={false}
        showAddress={true}
        showCoords={false}
      />

      <button type="button" className="btn secondary" style={{marginTop:12}} onClick={locate} disabled={loading}>
        {loading ? 'Recherche de la position...' : '📍 Utiliser ma position actuelle'}
      </button>
      {error && <div style={{color:'#b00020',marginTop:6}}>{error}</div>}

      {lastAddress && (
        <div className="address-selected" style={{display:'flex',alignItems:'center',background:'#e6f6f2',borderRadius:8,padding:'8px 12px',margin:'10px 0'}}>
          <span style={{fontSize:20,marginRight:8}}>📍</span>
          <span style={{fontWeight:600,color:'#07514b'}}>{lastAddress}</span>
        </div>
      )}
    </div>
  );
}
