// Script de test pour vérifier les queries stats
const pool = require('./config/db');

async function testQueries() {
  try {
    console.log('Test 1: Vérifier la table repair_requests...');
    const test1 = await pool.query('SELECT COUNT(*) FROM repair_requests');
    console.log('✅ Table repair_requests existe:', test1.rows[0].count, 'lignes');

    console.log('\nTest 2: Vérifier la table reviews...');
    const test2 = await pool.query('SELECT COUNT(*) FROM reviews');
    console.log('✅ Table reviews existe:', test2.rows[0].count, 'lignes');

    console.log('\nTest 3: Test query stats globales...');
    const startDateStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const test3 = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'repairer') as total_repairers,
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(*) FROM repair_requests WHERE created_at > '${startDateStr}') as repairs_period,
        (SELECT COUNT(*) FROM repair_requests WHERE status = 'terminée' AND created_at > '${startDateStr}') as repairs_completed,
        (SELECT COUNT(*) FROM reviews WHERE created_at > '${startDateStr}') as reviews_period,
        (SELECT AVG(rating) FROM reviews WHERE created_at > '${startDateStr}') as avg_rating,
        (SELECT COUNT(*) FROM repairer_profiles WHERE is_available = true) as verified_repairers,
        (SELECT COUNT(*) FROM users WHERE created_at > '${startDateStr}') as new_users_period
    `);
    console.log('✅ Query stats réussie:', JSON.stringify(test3.rows[0], null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testQueries();
