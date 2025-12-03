-- Migration pour la messagerie client ↔ réparateur (structure conversations/messages)
-- Gère la transition depuis l'ancienne table messages (sender_id/receiver_id) si elle existe

-- Créer la table conversations
CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  repairer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  repair_request_id INTEGER REFERENCES repair_requests(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Renommer l'ancienne table messages si elle existe (structure sender_id/receiver_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'messages' 
    AND table_schema = 'public'
  ) THEN
    -- Vérifier si c'est l'ancienne structure (sans conversation_id)
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'messages' 
      AND column_name = 'conversation_id'
    ) THEN
      ALTER TABLE messages RENAME TO messages_old;
    END IF;
  END IF;
END $$;

-- Créer la nouvelle table messages (structure conversation_id)
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_conversations_repairer ON conversations(repairer_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
