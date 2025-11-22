-- Add unique constraint to prevent a repairer from creating multiple offers for the same repair request
ALTER TABLE repair_offers
ADD CONSTRAINT uq_repair_offers_request_repairer UNIQUE (repair_request_id, repairer_id);
