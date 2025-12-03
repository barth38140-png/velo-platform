-- Migration 006: Ajouter système de négociation de dates aux offres
-- Permet un échange de propositions de dates entre client et réparateur
-- avant que l'offre puisse être acceptée

-- Ajouter colonnes pour la négociation de dates
ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS date_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS proposed_by VARCHAR(20); -- 'repairer' ou 'client'
ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS date_confirmed_at TIMESTAMP;

-- Contrainte sur date_status
ALTER TABLE repair_offers DROP CONSTRAINT IF EXISTS check_date_status;
ALTER TABLE repair_offers ADD CONSTRAINT check_date_status 
  CHECK (date_status IN ('pending', 'proposed_by_repairer', 'proposed_by_client', 'confirmed'));

-- Contrainte sur proposed_by
ALTER TABLE repair_offers DROP CONSTRAINT IF EXISTS check_proposed_by;
ALTER TABLE repair_offers ADD CONSTRAINT check_proposed_by 
  CHECK (proposed_by IS NULL OR proposed_by IN ('repairer', 'client'));

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_repair_offers_date_status ON repair_offers(date_status);

-- Commentaires
COMMENT ON COLUMN repair_offers.date_status IS 'Statut de la négociation de date: pending (aucune date), proposed_by_repairer, proposed_by_client, confirmed';
COMMENT ON COLUMN repair_offers.proposed_by IS 'Qui a proposé les dates actuelles: repairer ou client';
COMMENT ON COLUMN repair_offers.date_confirmed_at IS 'Timestamp de confirmation mutuelle de la date d''intervention';

-- Mettre à jour les offres existantes qui ont des dates
UPDATE repair_offers 
SET date_status = 'proposed_by_repairer', 
    proposed_by = 'repairer'
WHERE scheduled_from IS NOT NULL 
  AND date_status = 'pending';
