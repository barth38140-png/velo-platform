const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const pool = require('../config/db');

async function run() {
  try {
    console.log('Normalisation des statuts des offres vers ASCII...');
    await pool.query(`UPDATE public.repair_offers SET status = CASE status
      WHEN 'proposée' THEN 'proposed'
      WHEN 'acceptée' THEN 'accepted'
      WHEN 'rejetée' THEN 'rejected'
      WHEN 'annulée' THEN 'rejected'
      ELSE status END;`);
    console.log('✅ Statuts normalisés. Application de la contrainte 004...');
    await pool.query(`
      ALTER TABLE IF EXISTS public.repair_offers
        DROP CONSTRAINT IF EXISTS repair_offers_status_check;
      ALTER TABLE public.repair_offers
        ADD CONSTRAINT repair_offers_status_check
        CHECK (status IN ('proposed', 'accepted', 'rejected'));
      ALTER TABLE public.repair_offers
        ALTER COLUMN status SET DEFAULT 'proposed';
    `);
    console.log('✅ Contrainte mise à jour et défaut appliqué.');
  } catch (e) {
    console.error('❌ Erreur:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) run();
