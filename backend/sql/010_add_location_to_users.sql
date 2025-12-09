-- 010_add_location_to_users.sql
-- Ajoute la géolocalisation aux profils réparateur
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lat DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_lng DOUBLE PRECISION;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location_address TEXT;
