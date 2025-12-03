-- Migration 003: Normalisation des statuts de demandes et offres
-- Uniformise tous les statuts en français pour cohérence

-- Mise à jour des statuts existants dans repair_requests
-- Remplacer les statuts anglais par leurs équivalents français
UPDATE repair_requests SET status = 'en_attente' WHERE status IN ('pending', 'en attente');
UPDATE repair_requests SET status = 'assignée' WHERE status IN ('assigned', 'acceptée');
UPDATE repair_requests SET status = 'en_cours' WHERE status IN ('in_progress', 'in progress');
UPDATE repair_requests SET status = 'terminée' WHERE status IN ('completed', 'terminee');
UPDATE repair_requests SET status = 'annulée' WHERE status IN ('cancelled', 'canceled', 'annulee');

-- Mise à jour des statuts existants dans repair_offers
UPDATE repair_offers SET status = 'acceptée' WHERE status IN ('accepted', 'acceptee');
UPDATE repair_offers SET status = 'rejetée' WHERE status IN ('rejected', 'refusée', 'rejetee', 'refusee');
UPDATE repair_offers SET status = 'annulée' WHERE status IN ('cancelled', 'canceled', 'annulee');

-- Commentaires pour documentation
COMMENT ON COLUMN repair_requests.status IS 'Statuts possibles: créée, en_attente, assignée, en_cours, terminée, annulée';
COMMENT ON COLUMN repair_offers.status IS 'Statuts possibles: proposée, acceptée, rejetée, annulée';

-- Index déjà créé par migration précédente, mais on vérifie
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);
CREATE INDEX IF NOT EXISTS idx_repair_offers_status ON repair_offers(status);
