-- 005_add_status_last_login_to_users.sql
-- Ajoute les colonnes 'status' et 'last_login' à la table users pour l'administration

ALTER TABLE users ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;
