-- Migration: add metadata JSONB to repair_requests and table for photos
ALTER TABLE repair_requests
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS repair_request_photos (
  id SERIAL PRIMARY KEY,
  repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  filepath TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_repair_request_photos_request_id ON repair_request_photos(repair_request_id);
