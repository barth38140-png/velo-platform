// backend/scripts/apply_migration_005.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  const migrationFile = path.join(__dirname, '../sql/005_create_reviews_table.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  console.log('📦 Application de la migration 005: système de notation et notifications push...');

  try {
    await pool.query(sql);
    console.log('✅ Migration 005 appliquée avec succès !');
    console.log('✨ Tables créées:');
    console.log('   - repair_reviews (avis et notations)');
    console.log('   - push_subscriptions (abonnements push)');
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

applyMigration();
