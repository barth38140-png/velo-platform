-- 007_add_repair_id_to_reviews.sql
-- Ajoute la colonne repair_id à la table reviews pour la modération
ALTER TABLE reviews ADD COLUMN repair_id INTEGER;
-- Optionnel : ajouter une contrainte de clé étrangère si la table repairs existe
-- ALTER TABLE reviews ADD CONSTRAINT reviews_repair_id_fkey FOREIGN KEY (repair_id) REFERENCES repairs(id) ON DELETE SET NULL;