-- Migration SQL : création de la table centrale des compétences
-- Table : skills

CREATE TABLE IF NOT EXISTS skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(64) NOT NULL UNIQUE,
    category VARCHAR(64), -- optionnel
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);

-- Exemple d'insertion
-- INSERT INTO skills (name) VALUES ('freinage');
