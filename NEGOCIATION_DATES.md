# Négociation de dates d'intervention - Documentation

## Vue d'ensemble

Le système de négociation de dates permet aux clients et réparateurs de s'accorder sur une date d'intervention **avant** que l'offre puisse être acceptée. Cela évite les malentendus et garantit que les deux parties sont disponibles au moment choisi.

## Workflow

### 1. Proposition initiale (Réparateur)
- Le réparateur crée une offre et **peut** proposer des dates (`scheduled_from`, `scheduled_to`)
- Si aucune date n'est proposée → `date_status = 'pending'`
- Si une date est proposée → `date_status = 'proposed_by_repairer'`, `proposed_by = 'repairer'`

### 2. Réponse du client
Le client a 3 options :
- ✅ **Confirmer** la date proposée → `date_status = 'confirmed'`, `date_confirmed_at = NOW()`
- 🔄 **Contre-proposer** une autre date → `date_status = 'proposed_by_client'`, `proposed_by = 'client'`
- ❌ **Rejeter** l'offre (sans négocier)

### 3. Réponse du réparateur (si contre-proposition)
- ✅ **Confirmer** la date du client → `date_status = 'confirmed'`
- 🔄 **Contre-proposer** à nouveau
- ❌ **Annuler** son offre

### 4. Acceptation de l'offre
- **Condition obligatoire** : `date_status = 'confirmed'`
- Si le client tente d'accepter sans date confirmée → erreur 400 avec message explicite

## Modifications de la base de données

### Migration 006 : `backend/sql/006_add_date_negotiation_to_offers.sql`

```sql
ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS date_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS proposed_by VARCHAR(20);
ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS date_confirmed_at TIMESTAMP;

-- Contraintes
CHECK (date_status IN ('pending', 'proposed_by_repairer', 'proposed_by_client', 'confirmed'))
CHECK (proposed_by IS NULL OR proposed_by IN ('repairer', 'client'))
```

**Application** :
```bash
# Via Docker (recommandé)
docker exec -i velo-platform-db-1 psql -U postgres -d velo_platform < backend/sql/006_add_date_negotiation_to_offers.sql

# Ou via script Node.js (nécessite .env configuré)
node backend/scripts/apply_migration_006.js
```

## Backend

### Nouveaux endpoints

#### `POST /api/repair-offers/:offerId/propose-date`
Proposer ou contre-proposer une date d'intervention.

**Authentification** : Requise (client ou réparateur)

**Body** :
```json
{
  "scheduled_from": "2025-12-10T09:00:00Z",
  "scheduled_to": "2025-12-10T12:00:00Z"  // optionnel
}
```

**Réponse** :
```json
{
  "success": true,
  "offer": { ... },
  "message": "Date proposée avec succès"
}
```

**Erreurs** :
- 400 : Date invalide ou incohérente
- 403 : Non autorisé (ni client ni réparateur de cette offre)
- 404 : Offre introuvable

#### `POST /api/repair-offers/:offerId/confirm-date`
Confirmer la date proposée par l'autre partie.

**Authentification** : Requise

**Réponse** :
```json
{
  "success": true,
  "offer": { ... },
  "message": "Date confirmée avec succès. L'offre peut maintenant être acceptée."
}
```

**Erreurs** :
- 400 : Aucune date proposée, ou tentative de confirmer sa propre proposition
- 403 : Non autorisé
- 404 : Offre introuvable

### Modification de `acceptOffer`

**Nouveau comportement** :
```javascript
if (status === 'accepted') {
  if (offer.date_status !== 'confirmed') {
    return res.status(400).json({ 
      error: 'Vous devez d\'abord confirmer une date d\'intervention avec le réparateur avant d\'accepter l\'offre' 
    });
  }
}
```

### Notifications Socket.io

Nouveaux événements émis :
- `date_proposed` : Quand une date est proposée/contre-proposée
- `date_confirmed` : Quand une date est confirmée mutuellement

## Frontend

### Nouveau composant : `DateNegotiationModal.jsx`

Modal réutilisable pour la négociation de dates.

**Props** :
```javascript
{
  offer: Object,              // L'offre concernée
  onClose: Function,          // Callback de fermeture
  onDateProposed: Function,   // (scheduledFrom, scheduledTo) => Promise
  onDateConfirmed: Function,  // () => Promise
  isClient: Boolean           // true si vue client, false si réparateur
}
```

**Fonctionnalités** :
- Affiche la date actuelle proposée et par qui
- Formulaire pour proposer/contre-proposer une date
- Bouton de confirmation si c'est une proposition de l'autre partie
- Gestion des erreurs inline
- Responsive mobile

### Modifications des pages

#### `OffresList.jsx` (Vue client)
- ✅ Bouton "📅 Proposer/Négocier une date" pour chaque offre avec `status='proposée'`
- ✅ Badge indiquant le statut de la date : pending, proposée, confirmée
- ✅ Blocage du bouton "Accepter" tant que `date_status !== 'confirmed'`
- ✅ Message d'avertissement : "⚠️ Confirmez d'abord une date d'intervention avant d'accepter l'offre"

#### `MyOffers.jsx` (Vue réparateur)
- ✅ Bouton "📅 Proposer/Négocier une date" dans chaque carte d'offre
- ✅ Affichage du statut de la date avec badge coloré
- ✅ Modal de négociation avec `isClient={false}`

### Services API

**Ajouts dans `repairOfferService`** :
```javascript
proposeDate: (offerId, scheduledFrom, scheduledTo = null) =>
  api.post(`/repair-offers/${offerId}/propose-date`, { 
    scheduled_from: scheduledFrom, 
    scheduled_to: scheduledTo 
  }),

confirmDate: (offerId) =>
  api.post(`/repair-offers/${offerId}/confirm-date`)
```

## UX/UI

### Badges de statut
- 🟡 **Pending** : Aucune date proposée
- 🟠 **Proposée par réparateur** : En attente de réponse client
- 🔵 **Proposée par client** : En attente de réponse réparateur
- 🟢 **Confirmée** : Les deux parties sont d'accord

### Messages utilisateur
- Toast success : "📅 Date proposée au client/réparateur"
- Toast success : "✅ Date confirmée ! Vous pouvez maintenant accepter l'offre"
- Alerte inline : "⚠️ Confirmez d'abord une date d'intervention..."

## Tests manuels

### Scénario 1 : Réparateur propose, client accepte
1. Réparateur crée offre avec `scheduled_from`
2. Vérifier `date_status = 'proposed_by_repairer'`
3. Client ouvre modal, voit la proposition
4. Client clique "✅ Confirmer cette date"
5. Vérifier `date_status = 'confirmed'` et `date_confirmed_at` défini
6. Bouton "Accepter" devient actif
7. Client accepte l'offre → succès

### Scénario 2 : Négociation avec contre-proposition
1. Réparateur propose date A
2. Client contre-propose date B → `date_status = 'proposed_by_client'`
3. Réparateur reçoit notification
4. Réparateur ouvre modal, voit proposition client
5. Réparateur confirme date B → `date_status = 'confirmed'`
6. Client peut maintenant accepter l'offre

### Scénario 3 : Blocage sans date confirmée
1. Réparateur crée offre SANS date
2. Client tente d'accepter directement
3. Vérifier message d'erreur 400
4. Vérifier message UI : "⚠️ Confirmez d'abord une date..."
5. Bouton "Accepter" désactivé ou absent

## Migration depuis l'ancien système

Les offres existantes avec `scheduled_from` défini seront automatiquement migrées :
```sql
UPDATE repair_offers 
SET date_status = 'proposed_by_repairer', 
    proposed_by = 'repairer'
WHERE scheduled_from IS NOT NULL 
  AND date_status = 'pending';
```

## Points d'attention

1. **Socket.io** : Les événements `date_proposed` et `date_confirmed` permettent une mise à jour temps réel
2. **Validation** : Les dates passées sont rejetées côté client (input type="datetime-local" avec attribut `min`)
3. **Timezone** : Les dates sont stockées en UTC et affichées en locale utilisateur
4. **Performance** : Index ajouté sur `date_status` pour optimiser les requêtes

## Fichiers modifiés/créés

### Backend
- ✅ `sql/006_add_date_negotiation_to_offers.sql`
- ✅ `scripts/apply_migration_006.js`
- ✅ `models/repairOfferModel.js` (+2 fonctions)
- ✅ `controllers/repairOfferController.js` (+2 endpoints + validation)
- ✅ `routes/repairOfferRoutes.js` (+2 routes)

### Frontend
- ✅ `components/DateNegotiationModal.jsx`
- ✅ `styles/DateNegotiationModal.css`
- ✅ `pages/OffresList.jsx` (modifications)
- ✅ `pages/MyOffers.jsx` (modifications)
- ✅ `services/api.js` (+2 méthodes)

## Prochaines étapes

1. ✅ Code backend et frontend complet
2. ⏳ Appliquer migration 006 (nécessite Docker ou connexion DB)
3. ⏳ Tests d'intégration end-to-end
4. ⏳ Mise à jour USER_GUIDE.md
5. ⏳ Commit et déploiement
