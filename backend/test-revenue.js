const pool = require('./config/db');

async function testRevenueQuery() {
  try {
    const startDateStr = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    console.log('Test 1: Revenue stats...');
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'terminée' THEN 1 END) as completed_repairs,
        COUNT(CASE WHEN status = 'en_cours' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'en_attente' THEN 1 END) as pending,
        AVG(CASE WHEN status = 'terminée' THEN 45 ELSE NULL END)::INTEGER as avg_repair_value
      FROM repair_requests
      WHERE created_at > '${startDateStr}'
    `);
    console.log('✅ Revenue query:', JSON.stringify(result.rows[0], null, 2));

    console.log('\nTest 2: Top repairers...');
    const topRepairers = await pool.query(`
      SELECT 
        u.id, u.email, u.name,
        COUNT(r.id) as repairs_completed,
        AVG(rev.rating)::NUMERIC(3,2) as avg_rating,
        (COUNT(r.id) * 45)::INTEGER as estimated_revenue
      FROM users u
      LEFT JOIN repair_requests r ON u.id = r.assigned_repairer_id AND r.status = 'terminée' AND r.created_at > '${startDateStr}'
      LEFT JOIN reviews rev ON u.id = rev.repairer_id
      WHERE u.role = 'repairer'
      GROUP BY u.id, u.email, u.name
      ORDER BY repairs_completed DESC
      LIMIT 5
    `);
    console.log('✅ Top repairers:', JSON.stringify(topRepairers.rows, null, 2));

    process.exit(0);
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    console.error('Position:', err.position);
    console.error('Stack:', err.stack);
    process.exit(1);
  }
}

testRevenueQuery();
