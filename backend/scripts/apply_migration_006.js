// Script pour appliquer la migration 006: négociation de dates
const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

async function applyMigration() {
  console.log('📅 Application de la migration 006: négociation de dates...');
  
  try {
    const sqlPath = path.join(__dirname, '../sql/006_add_date_negotiation_to_offers.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration 006 appliquée avec succès !');
    console.log('   - Colonnes ajoutées: date_status, proposed_by, date_confirmed_at');
    console.log('   - Contraintes: check_date_status, check_proposed_by');
    console.log('   - Index: idx_repair_offers_date_status');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de l\'application de la migration:', error);
    process.exit(1);
  }
}

applyMigration();
