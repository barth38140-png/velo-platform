# Amélioration de la Plateforme Vélo - Nouveau Flux de Communication

## Vue d'ensemble

La plateforme a été améliorée pour permettre un flux de communication robuste entre clients et réparateurs autour des demandes de réparation.

## Nouvelles Fonctionnalités

### 1. **Explore Repairs (Réparateurs)**
**Chemin**: `Dashboard → Explore Repairs`

Les réparateurs peuvent maintenant:
- ✅ Voir toutes les demandes de réparation disponibles dans la système
- ✅ Filtrer par proximité (20 km autour de leur emplacement)
- ✅ Consulter les détails de chaque demande (type de vélo, description, localisation)
- ✅ Soumettre une offre avec:
  - Prix estimé (EUR)
  - Durée estimée (heures)
  - Message personnalisé au client

**Fichiers créés**:
- `frontend/src/pages/ExploreRepairs.jsx`
- `frontend/src/styles/ExploreRepairs.css`

**Backend correspondant**:
- Route: `GET /api/repairs/pending-requests`
- Filtre de proximité via Haversine (20 km par défaut)

### 2. **My Offers (Réparateurs)**
**Chemin**: `Dashboard → My Offers`

Les réparateurs peuvent gérer leurs offres:
- ✅ Voir toutes les offres qu'ils ont soumises
- ✅ Filtrer par statut: Pending, Accepted, Rejected
- ✅ Voir le détail de chaque offre:
  - Détails de la demande
  - Prix quoté et durée
  - Message au client
- ✅ Attendre la réponse du client (acceptation/rejet)

**Fichiers créés**:
- `frontend/src/pages/MyOffers.jsx`
- `frontend/src/styles/MyOffers.css`

**Backend correspondant**:
- Route: `GET /api/repair-offers/my-offers`
- Endpoint: `GET /api/repair-offers/:offerId`

### 3. **Offers Received (Clients)**
**Chemin**: `Dashboard → Offers Received`

Les clients peuvent consulter et gérer les offres reçues:
- ✅ Voir toutes les offres pour leurs demandes
- ✅ Filtrer par statut: Pending, Accepted, Rejected
- ✅ Voir pour chaque offre:
  - Nom et contact du réparateur
  - Prix quoté
  - Durée estimée
  - Message du réparateur
- ✅ Accepter ou rejeter une offre
- ✅ Une fois acceptée, les détails du réparateur sont disponibles

**Fichiers créés**:
- `frontend/src/pages/OffersReceived.jsx`
- `frontend/src/styles/OffersReceived.css`

**Backend correspondant**:
- Route: `GET /api/repair-offers/client-offers` (NEW)
- Route: `PATCH /api/repair-offers/:offerId/status`

## Architecture du Flux

```
CLIENT                          RÉPARATEUR
   |                                |
   |  1. Crée demande              |
   |  (Create Repair)              |
   |                                |
   |                          2. Consulte demandes
   |                          (Explore Repairs)
   |                                |
   |<----- 3. Soumet offre ---------|
   |        (submit offer)          |
   |                                |
4. Reçoit offre                     |
   (Offers Received)          5. Attend réponse
   |                          (My Offers)
   |                                |
6. Accepte/Rejette ------->  7. Voit réponse
   (PATCH status)                  |
   |                                |
8. Contact établi           8. Contact établi
   |                                |
```

## Routes Backend Améliorées

### Repair Offers

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | `/api/repair-offers` | Créer une nouvelle offre |
| GET | `/api/repair-offers/my-offers` | Récupérer les offres du réparateur |
| GET | `/api/repair-offers/client-offers` | Récupérer les offres reçues (client) |
| GET | `/api/repair-offers/:offairId` | Détail d'une offre |
| GET | `/api/repair-offers/:repairId/offers` | Toutes les offres pour une demande |
| PATCH | `/api/repair-offers/:offerId/status` | Accepter/Rejeter une offre |

### Validation des données

Toutes les créations d'offres sont validées:
- `offered_price`: > 0 EUR
- `estimated_duration_hours`: >= 1 heure
- `message`: 5-1000 caractères
- `repair_request_id`: ID valide de demande

## Base de Données

### Table `repair_offers`

```sql
CREATE TABLE repair_offers (
  id SERIAL PRIMARY KEY,
  repair_request_id INT NOT NULL REFERENCES repair_requests(id),
  repairer_id INT NOT NULL REFERENCES users(id),
  offered_price DECIMAL(10, 2) NOT NULL,
  estimated_duration_hours INT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, accepted, rejected
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Liens de Données

- Une demande peut avoir **plusieurs** offres
- Un réparateur ne peut pas soumettre **deux** offres pour la même demande
- Le client peut **accepter une seule** offre (les autres sont automatiquement rejetées dans v2)

## Tests Recommandés

### Scénario 1: Client et Réparateur (Happy Path)

1. **Inscrivez-vous** comme Client
   - Email: `client@test.fr`
   - Rôle: `client`

2. **Créez une demande** de réparation
   - Titre: "Chaîne cassée"
   - Description: "Ma chaîne est cassée, besoin de remplacement"
   - Type: "VTT"
   - Localisation: "Paris"

3. **Inscrivez-vous** comme Réparateur
   - Email: `repairer@test.fr`
   - Rôle: `repairer`

4. **Consultez les demandes**
   - Allez à "Explore Repairs"
   - Vous devriez voir la demande du client

5. **Soumettez une offre**
   - Prix: 45 EUR
   - Durée: 1 heure
   - Message: "Je peux réparer votre chaîne rapidement"

6. **Côté Client** - Acceptez l'offre
   - Allez à "Offers Received"
   - Cliquez sur "Accept Offer"

7. **Côté Réparateur** - Vérifiez l'acceptation
   - Allez à "My Offers"
   - L'offre devrait avoir le statut "accepted"

### Scénario 2: Rejeter une Offre

1. Répétez les étapes 1-5 du scénario 1 (avec emails différents)
2. **Côté Client**:
   - Allez à "Offers Received"
   - Cliquez sur "Reject"
3. **Côté Réparateur**:
   - Allez à "My Offers"
   - L'offre devrait avoir le statut "rejected"

## Améliorations Futures (Roadmap v2)

- [ ] Chat temps réel via Socket.io (en cours)
- [ ] Acceptation automatique unique (rejeter autres offres)
- [ ] Notifications en temps réel
- [ ] Rating/Review après réparation
- [ ] Historique des transactions
- [ ] Paiement intégré (Stripe)
- [ ] Système de garantie
- [ ] Assurance réparation

## Notes de Développement

### Contrôleur repairOfferController
- ✅ `createOffer`: Valide et crée offre
- ✅ `getMyOffers`: Offres du réparateur actuel
- ✅ `getClientOffers`: **NOUVEAU** - Offres reçues par le client
- ✅ `getOfferDetail`: Détail d'une offre
- ✅ `updateOfferStatus`: Accepte/Rejette (avec vérification du propriétaire)

### Modèle repairOfferModel
- ✅ `getOffersByClient`: **NOUVEAU** - Récupère offres par client
- ✅ Toutes les requêtes utilisent paramètre binding (sécurité)
- ✅ Jointures SQL optimisées avec données complètes

### Service API Frontend (api.js)
- ✅ `createOffer`: POST offer
- ✅ `getRepairerOffers`: GET my-offers (repairer)
- ✅ `getClientOffers`: GET client-offers (client) - **NOUVEAU**
- ✅ `acceptOffer`: PATCH :offerId/status (accept)
- ✅ `rejectOffer`: PATCH :offerId/status (reject)

## Déploiement

1. **Backend** reste inchangé (port 5000)
2. **Frontend** rechargez la page pour voir les nouveaux onglets du Dashboard
3. **Base de données** - Aucune migration requise (tables déjà existantes)

## Support

Si vous rencontrez des problèmes:

1. Vérifiez que la base de données PostgreSQL fonctionne
2. Vérifiez les logs du backend: `backend/` terminal
3. Vérifiez la console du navigateur: F12 → Console
4. Vérifiez la requête API: F12 → Network

---

**Date**: 15 novembre 2025
**Version**: 2.0
**Statut**: Stable - Testé ✅
