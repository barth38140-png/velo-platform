-- 🔐 Utilisateurs
INSERT INTO users (email, password) VALUES
('vincent@example.com', '$2b$10$hashedVincent'),
('sophie@example.com', '$2b$10$hashedSophie');

-- 🔧 Demande de réparation
INSERT INTO repair_requests (user_id, title, description, status) VALUES
(1, 'Problème de dérailleur', 'Le dérailleur arrière saute les vitesses', 'pending');

-- 💬 Message
INSERT INTO messages (sender_id, receiver_id, content) VALUES
(1, 2, 'Bonjour Sophie, pouvez-vous réparer mon vélo demain ?');

-- 📍 Localisation
INSERT INTO locations (user_id, latitude, longitude) VALUES
(1, 45.045, 5.050),
(2, 45.047, 5.052);

