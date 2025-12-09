import { useState, useCallback, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

/**
 * Hook pour gérer la géolocalisation automatique
 * @returns {Object} { location, loading, error, requestLocation, clearLocation }
 */
export function useGeolocation() {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  function requestLocation() {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      const err = 'La géolocalisation n\'est pas supportée par votre navigateur';
      setError(err);
      toast.error(err, 4000, {
        actionLabel: 'Réessayer',
        action: retryLocation
      });
      setLoading(false);
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const loc = { latitude, longitude };
          setLocation(loc);
          setLoading(false);
          toast.success('Localisation détectée ✓', 3000, {
            description: `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
          });
          resolve(loc);
        },
        (err) => {
          setLoading(false);
          let errorMsg = 'Erreur lors de la géolocalisation';
          if (err.code === err.PERMISSION_DENIED) {
            errorMsg = 'Accès à la géolocalisation refusé. Vérifiez vos paramètres.';
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errorMsg = 'Localisation indisponible actuellement';
          } else if (err.code === err.TIMEOUT) {
            errorMsg = 'La géolocalisation a expiré';
          }
          setError(errorMsg);
          toast.error(errorMsg, 4000, {
            actionLabel: 'Réessayer',
            action: retryLocation
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  }

  const retryLocation = () => {
    requestLocation();
  };

  const clearLocation = useCallback(() => {
    setLocation(null);
    setError(null);
  }, []);

  return { location, loading, error, requestLocation, clearLocation };
}

/**
 * Obtenir le nom d'une localisation via API inverse de geocoding (Nominatim)
 */
export async function getLocationName(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    if (!response.ok) throw new Error('Geocoding failed');
    const data = await response.json();
    return data.address?.city || data.address?.town || data.address?.county || 'Localisation';
  } catch {
    return null;
  }
}

/**
 * Calculer la distance entre deux points (Haversine formula)
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
