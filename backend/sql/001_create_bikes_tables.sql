-- Migration: create bikes and bike_components tables
-- Run this file against your development database to enable Mes Velos features.

CREATE TABLE IF NOT EXISTS bikes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  frame_size TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bike_components (
  id SERIAL PRIMARY KEY,
  bike_id INTEGER NOT NULL REFERENCES bikes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  wear INTEGER DEFAULT 0,
  last_replaced_at TIMESTAMP
);
