-- Met à jour la contrainte de vérification et la valeur par défaut
-- pour la colonne status de la table repair_offers
-- Autorise des valeurs ASCII: proposed, accepted, rejected

BEGIN;

-- Supprimer la contrainte existante si présente
ALTER TABLE IF EXISTS public.repair_offers
  DROP CONSTRAINT IF EXISTS repair_offers_status_check;

-- Appliquer une contrainte de vérification cohérente
ALTER TABLE public.repair_offers
  ADD CONSTRAINT repair_offers_status_check
  CHECK (status IN ('proposed', 'accepted', 'rejected'));

-- Mettre à jour la valeur par défaut de status
ALTER TABLE public.repair_offers
  ALTER COLUMN status SET DEFAULT 'proposed';

COMMIT;
