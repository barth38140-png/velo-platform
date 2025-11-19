CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

INSERT INTO users (username, email, password_hash)
VALUES (''admin'',''admin@example.com'',''$2b$10$EXAMPLEHASH'')
ON CONFLICT DO NOTHING;
