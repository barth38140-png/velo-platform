-- Migration: add assigned_repairer_id to repair_requests if missing
-- Run this against your database to ensure the column exists.

ALTER TABLE repair_requests
  ADD COLUMN IF NOT EXISTS assigned_repairer_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Optionally update existing rows if needed (example: set to NULL explicitly)
-- UPDATE repair_requests SET assigned_repairer_id = NULL WHERE assigned_repairer_id IS NULL;
