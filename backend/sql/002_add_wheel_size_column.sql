-- Migration: add wheel_size column to bikes table
ALTER TABLE bikes ADD COLUMN IF NOT EXISTS wheel_size TEXT;