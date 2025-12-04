#!/usr/bin/env node
/* Seed bike models into Postgres from a JSON file.
 * Usage:
 *   node scripts/seed_bike_models.js [optionalPathToJson]
 * Env:
 *   PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE (or DB_* equivalents)
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('../src/db');

function toTitleCase(str) {
  return String(str || '')
    .split(/\s+/)
    .map((tok) => {
      const t = tok.trim();
      if (!t) return '';
      if (t.length <= 3 && /^[A-Z0-9]+$/.test(t)) return t.toUpperCase();
      return t.toLowerCase().split('-').map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join('-');
    })
    .join(' ');
}

async function ensureTable() {
  await db.query(`
      CREATE TABLE IF NOT EXISTS bike_models (
        id SERIAL PRIMARY KEY,
        brand TEXT NOT NULL,
        model TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS uniq_models_lower_brand_model 
        ON bike_models ((LOWER(brand)), (LOWER(model)));
      CREATE INDEX IF NOT EXISTS idx_models_brand ON bike_models(LOWER(brand));
    `);
}

async function main() {
  try {
    const jsonPath = process.argv[2] ? path.resolve(process.argv[2]) : path.resolve(__dirname, 'seed_bike_models.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('[seed] JSON file not found:', jsonPath);
      process.exit(2);
    }
    const raw = fs.readFileSync(jsonPath, 'utf8');
    const seeds = JSON.parse(raw);

    await ensureTable();

    let totalBrands = 0;
    let totalModels = 0;
    let inserted = 0;

    for (const entry of seeds) {
      if (!entry || typeof entry.brand !== 'string' || !Array.isArray(entry.models)) continue;
      totalBrands++;
      const brandNorm = toTitleCase(entry.brand.trim());
      for (const m of entry.models) {
        if (!m || typeof m !== 'string') continue;
        const modelNorm = toTitleCase(m.trim());
        if (!modelNorm) continue;
        totalModels++;
        const res = await db.query(
          'INSERT INTO bike_models (brand, model) VALUES ($1, $2) ON CONFLICT ((LOWER(brand)), (LOWER(model))) DO NOTHING RETURNING id',
          [brandNorm, modelNorm]
        );
        if (res.rowCount === 1) inserted++;
      }
    }

    console.log(`[seed] Done. Brands: ${totalBrands}, Models processed: ${totalModels}, Inserted: ${inserted}`);
    process.exit(0);
  } catch (e) {
    console.error('[seed] error:', e && (e.stack || e));
    process.exit(1);
  } finally {
    try { await db.pool.end(); } catch {
      // Ignorer les erreurs de fermeture
    }
  }
}

main();
