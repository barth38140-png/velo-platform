// Mapping statut (base sans accent → affichage avec accent)
const statutLibelle = {
  cree: 'Créée',
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  terminee: 'Terminée',
  annulee: 'Annulée',
  // fallback pour anciens statuts
  assigned: 'En attente',
  cancelled: 'Annulée',
  'créée': 'Créée',
  pending: 'Créée'
};
export default statutLibelle;
