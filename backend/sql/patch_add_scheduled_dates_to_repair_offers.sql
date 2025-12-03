-- Ajout des colonnes de planification d'intervention sur les offres de réparation
-- Permet aux réparateurs de proposer une date/intervalle pour l'intervention

ALTER TABLE repair_offers
  ADD COLUMN IF NOT EXISTS scheduled_from TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS scheduled_to TIMESTAMP NULL;

-- Index pour tri/recherche par date planifiée
CREATE INDEX IF NOT EXISTS idx_repair_offers_scheduled_from ON repair_offers (scheduled_from);
CREATE INDEX IF NOT EXISTS idx_repair_offers_scheduled_to ON repair_offers (scheduled_to);
