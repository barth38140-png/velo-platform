-- Migration : création de la table message_flags pour la modération des messages
CREATE TABLE IF NOT EXISTS message_flags (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reason VARCHAR(128) NOT NULL,
    status VARCHAR(32) DEFAULT 'pending',
    moderation_notes TEXT,
    moderated_at TIMESTAMP,
    moderated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
