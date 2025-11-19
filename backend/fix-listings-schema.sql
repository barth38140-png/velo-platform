BEGIN;

-- créer listings si elle n'existe pas (structure minimale)
CREATE TABLE IF NOT EXISTS listings (
  id integer PRIMARY KEY,
  owner_id integer,
  title text
);

-- ajouter repairer_id si manquante (sécurisé)
DO Env:PGPASSWORD
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='listings' AND column_name='repairer_id'
  ) THEN
    ALTER TABLE listings ADD COLUMN repairer_id integer;
  END IF;
END
Env:PGPASSWORD;

-- backfill repairer_id à 0 pour les lignes existantes (idempotent)
UPDATE listings SET repairer_id = 0 WHERE repairer_id IS NULL;

-- s'assurer qu'il y a un user placeholder id=0 si on backfill à 0
CREATE TABLE IF NOT EXISTS users (
  id integer PRIMARY KEY,
  email text UNIQUE,
  name text,
  password_hash text
);

INSERT INTO users (id,email,name,password_hash)
VALUES (0,'placeholder@local','Placeholder','hash')
ON CONFLICT (id) DO NOTHING;

COMMIT;
