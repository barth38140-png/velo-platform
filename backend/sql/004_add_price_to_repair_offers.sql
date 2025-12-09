-- 004_add_price_to_repair_offers.sql
-- Ajoute la colonne 'price' à la table repair_offers pour les statistiques et la gestion des offres

ALTER TABLE repair_offers ADD COLUMN IF NOT EXISTS price NUMERIC(8,2) DEFAULT 0;
