-- Création de la table des créneaux de disponibilité des réparateurs
CREATE TABLE IF NOT EXISTS availability_slots (
  id SERIAL PRIMARY KEY,
  repairer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'free', -- free | reserved | cancelled
  reserved_by_request_id INTEGER REFERENCES repair_requests(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_availability_slots_repairer ON availability_slots(repairer_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_time ON availability_slots(starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_availability_slots_status ON availability_slots(status);

-- Contrainte: starts_at < ends_at
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_valid_interval CHECK (starts_at < ends_at);

-- Contrainte anti chevauchement par réparateur sur slots libres
-- Empêche deux créneaux qui se chevauchent pour le même réparateur
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_no_overlap
  EXCLUDE USING gist (
    repairer_id WITH =,
    tsrange(starts_at, ends_at) WITH &&
  ) WHERE (status = 'free');

-- Trigger pour updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS availability_slots_set_updated_at ON availability_slots;
CREATE TRIGGER availability_slots_set_updated_at
BEFORE UPDATE ON availability_slots
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
