#!/usr/bin/env node
/**
 * Script d'application de la migration 003: Normalisation des statuts
 * Exécute le fichier SQL 003_normalize_repair_statuses.sql
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');

async function applyMigration003() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Application de la migration 003: Normalisation des statuts...');
    
    const sqlPath = path.join(__dirname, '../sql/003_normalize_repair_statuses.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    
    console.log('✅ Migration 003 appliquée avec succès');
    console.log('📋 Statuts normalisés:');
    console.log('   - repair_requests: créée, en_attente, assignée, en_cours, terminée, annulée');
    console.log('   - repair_offers: proposée, acceptée, rejetée, annulée');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Erreur lors de la migration:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  applyMigration003()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { applyMigration003 };
