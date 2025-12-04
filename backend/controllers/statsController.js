const logger = require('../src/logger');
const pool = require('../config/db');

/**
 * Admin: Obtenir les statistiques globales
 */
async function getGlobalStats(req, res) {
  try {
    const { period = '7d' } = req.query;
    
    const startDate = getPeriodStartDate(period);
    const startDateStr = startDate.toISOString();
    
    // Récupérer les statistiques
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'repairer') as total_repairers,
        (SELECT COUNT(*) FROM users WHERE role = 'client') as total_clients,
        (SELECT COUNT(*) FROM repair_requests WHERE created_at > '${startDateStr}') as repairs_period,
        (SELECT COUNT(*) FROM repair_requests WHERE status = 'completed' AND created_at > '${startDateStr}') as repairs_completed,
        (SELECT COUNT(*) FROM repair_reviews WHERE created_at > '${startDateStr}') as reviews_period,
        (SELECT AVG(rating) FROM repair_reviews WHERE created_at > '${startDateStr}') as avg_rating,
        (SELECT COUNT(*) FROM users WHERE verified = true AND role = 'repairer') as verified_repairers,
        (SELECT COUNT(*) FROM users WHERE created_at > '${startDateStr}') as new_users_period
    `);
    
    return res.json({
      success: true,
      stats: stats.rows[0],
      period
    });
  } catch (err) {
    logger.error({ err }, 'getGlobalStats error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Obtenir les statistiques de revenue (simulé)
 */
async function getRevenueStats(req, res) {
  try {
    const { period = '7d' } = req.query;
    
    const startDate = getPeriodStartDate(period);
    const startDateStr = startDate.toISOString();
    
    // Simuler revenue basé sur les réparations complétées
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_repairs,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_repairs,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        AVG(CASE WHEN status = 'completed' THEN 45 ELSE NULL END)::INTEGER as avg_repair_value
      FROM repair_requests
      WHERE created_at > '${startDateStr}'
    `);
    
    const data = result.rows[0];
    const estimatedRevenue = (data.completed_repairs * data.avg_repair_value) || 0;
    
    // Statistiques par réparateur (top 5)
    const topRepairers = await pool.query(`
      SELECT 
        u.id, u.email, u.name,
        COUNT(r.id) as repairs_completed,
        AVG(rev.rating)::NUMERIC(3,2) as avg_rating,
        (COUNT(r.id) * 45)::INTEGER as estimated_revenue
      FROM users u
      LEFT JOIN repair_requests r ON u.id = r.repairer_id AND r.status = 'completed' AND r.created_at > '${startDateStr}'
      LEFT JOIN repair_reviews rev ON u.id = rev.repairer_id
      WHERE u.role = 'repairer'
      GROUP BY u.id, u.email, u.name
      ORDER BY repairs_completed DESC
      LIMIT 5
    `);
    
    return res.json({
      success: true,
      revenue: {
        period,
        total_repairs: data.total_repairs,
        completed_repairs: data.completed_repairs,
        in_progress: data.in_progress,
        pending: data.pending,
        estimated_revenue: estimatedRevenue,
        avg_repair_value: data.avg_repair_value || 0
      },
      top_repairers: topRepairers.rows
    });
  } catch (err) {
    logger.error({ err }, 'getRevenueStats error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Obtenir les logs d'audit
 */
async function getAuditLogs(req, res) {
  try {
    const { action = 'all', limit = 100, offset = 0 } = req.query;
    
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (action !== 'all') {
      query += ' AND action = $' + (params.length + 1);
      params.push(action);
    }
    
    const countRes = await pool.query(
      query.replace('SELECT *', 'SELECT COUNT(*) as total') + ' FROM audit_logs',
      params
    );
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      logs: result.rows,
      total: parseInt(countRes.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error({ err }, 'getAuditLogs error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Obtenir les statistiques d'activité par jour
 */
async function getActivityCharts(req, res) {
  try {
    const { period = '7d' } = req.query;
    
    const startDate = getPeriodStartDate(period);
    const startDateStr = startDate.toISOString();
    
    const repairs = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
      FROM repair_requests
      WHERE created_at > '${startDateStr}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    const users = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        COUNT(CASE WHEN role = 'repairer' THEN 1 END) as repairers,
        COUNT(CASE WHEN role = 'client' THEN 1 END) as clients
      FROM users
      WHERE created_at > '${startDateStr}'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `);
    
    return res.json({
      success: true,
      repairs: repairs.rows,
      users: users.rows,
      period
    });
  } catch (err) {
    logger.error({ err }, 'getActivityCharts error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Helper: Retourner la date de début pour les statistiques
 */
function getPeriodStartDate(period) {
  const now = new Date();
  
  switch(period) {
    case '7d':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
}

module.exports = {
  getGlobalStats,
  getRevenueStats,
  getAuditLogs,
  getActivityCharts
};
