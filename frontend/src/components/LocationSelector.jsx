import React, { useState } from 'react';
import MapPicker from './MapPicker';

export default function LocationSelector({ initial = {}, onChange }) {
  const [query, setQuery] = useState('');
  const [precise, setPrecise] = useState(initial.precise || '');

  const handleMapChange = (pos) => {
    const payload = { locationLat: pos.lat, locationLng: pos.lng, locationAddress: pos.address, precise };
    onChange && onChange(payload);
  };

  const handleSearchSelect = (pos) => {
    const payload = { locationLat: pos.lat, locationLng: pos.lng, locationAddress: pos.address, precise };
    onChange && onChange(payload);
  };

  return (
    <div className="location-selector">
      <label className="label">Rechercher par ville ou code postal</label>
      <MapPicker initialPosition={{ lat: initial.locationLat || 48.8566, lng: initial.locationLng || 2.3522 }} onChange={(p) => handleMapChange({ lat: p.lat, lng: p.lng, address: p.address })} showSearch={true} showConfirm={false} showAddress={true} showCoords={false} />

      <label className="label" style={{marginTop:8}}>Lieu précis (optionnel)</label>
      <input value={precise} onChange={e => { setPrecise(e.target.value); onChange && onChange({ locationLat: initial.locationLat, locationLng: initial.locationLng, locationAddress: initial.locationAddress, precise: e.target.value }); }} placeholder="Rue, numéro, local..." />
    </div>
  );
}
