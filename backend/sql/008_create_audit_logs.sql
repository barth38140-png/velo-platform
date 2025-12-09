-- Migration : création de la table audit_logs pour la modération et le suivi admin
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(64) NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    details TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
