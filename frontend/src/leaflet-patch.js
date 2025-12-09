// Patch global Leaflet pour Vite

import L from 'leaflet';
// Correction : utiliser les chemins statiques publics pour Vite
L.Icon.Default.mergeOptions({
  iconUrl: '/marker-icon.png',
  iconRetinaUrl: '/marker-icon-2x.png',
  shadowUrl: '/marker-shadow.png',
});

// ... Ce fichier doit être importé dans le composant principal ou dans le setup global de l'app
