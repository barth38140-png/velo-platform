-- Migration 005: Système de notation et avis
-- Créé le: 2025-12-03

-- Table pour stocker les avis sur les réparations terminées
CREATE TABLE IF NOT EXISTS repair_reviews (
    id SERIAL PRIMARY KEY,
    repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
    client_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    repairer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(repair_request_id) -- Un seul avis par réparation
);

-- Index pour performance
CREATE INDEX idx_repair_reviews_repairer ON repair_reviews(repairer_id);
CREATE INDEX idx_repair_reviews_rating ON repair_reviews(rating);
CREATE INDEX idx_repair_reviews_created ON repair_reviews(created_at DESC);

-- Table pour les abonnements Web Push
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, endpoint)
);

CREATE INDEX idx_push_subscriptions_user ON push_subscriptions(user_id);

COMMENT ON TABLE repair_reviews IS 'Avis et notations des clients sur les réparations terminées';
COMMENT ON TABLE push_subscriptions IS 'Abonnements Web Push pour notifications navigateur';
