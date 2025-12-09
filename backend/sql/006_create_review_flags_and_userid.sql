-- 006_create_review_flags_and_userid.sql
-- Ajoute la colonne user_id à reviews et crée la table review_flags pour la modération

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id INTEGER;

CREATE TABLE IF NOT EXISTS review_flags (
  id SERIAL PRIMARY KEY,
  review_id INTEGER REFERENCES reviews(id) ON DELETE CASCADE,
  reason TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  moderation_notes TEXT,
  moderated_at TIMESTAMP,
  moderated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_review_flags_review_id ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON review_flags(status);
