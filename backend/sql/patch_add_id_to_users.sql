-- Patch: add id column to users table if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='id') THEN
        ALTER TABLE users ADD COLUMN id SERIAL PRIMARY KEY;
    END IF;
END $$;