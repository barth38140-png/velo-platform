-- Migration : Ajout du champ status pour le suivi des demandes et offres
-- Table repair_requests
ALTER TABLE repair_requests ADD COLUMN status VARCHAR(20) DEFAULT 'créée';
-- Table repair_offers
ALTER TABLE repair_offers ADD COLUMN status VARCHAR(20) DEFAULT 'proposée';

-- Index pour les statuts
CREATE INDEX idx_repair_requests_status ON repair_requests(status);
CREATE INDEX idx_repair_offers_status ON repair_offers(status);

-- Documentation des statuts possibles
-- repair_requests.status : créée, en_attente, acceptée, refusée, terminée
-- repair_offers.status : proposée, acceptée, refusée, annulée
