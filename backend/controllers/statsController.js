const adminStatsModel = require('../models/adminStatsModel');
const logger = require('pino')();
const pool = require('../config/db');

/**
 * Admin: Obtenir les statistiques globales
 * GET /api/admin/stats/global?period=7d
 */
async function getGlobalStats(req, res) {
  try {
    const period = req.query.period || '7d';
    
    // Validation de la période
    if (!['7d', '30d', '90d', 'all'].includes(period)) {
      return res.status(400).json({ 
        error: 'Période invalide. Valeurs acceptées: 7d, 30d, 90d, all' 
      });
    }

    logger.info({ period }, 'Fetching global stats');
    const stats = await adminStatsModel.getGlobalStats(period);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error fetching global stats');
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques globales',
      details: error.message 
    });
  }
}

/**
 * Admin: Obtenir les statistiques de revenus
 * GET /api/admin/stats/revenue?period=7d
 */
async function getRevenueStats(req, res) {
  try {
    const period = req.query.period || '7d';
    
    // Validation de la période
    if (!['7d', '30d', '90d', 'all'].includes(period)) {
      return res.status(400).json({ 
        error: 'Période invalide. Valeurs acceptées: 7d, 30d, 90d, all' 
      });
    }

    logger.info({ period }, 'Fetching revenue stats');
    const stats = await adminStatsModel.getRevenueStats(period);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error fetching revenue stats');
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques de revenus',
      details: error.message 
    });
  }
}

/**
 * Admin: Obtenir les logs d'audit
 * GET /api/admin/stats/audit-logs
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
      query.replace('SELECT *', 'SELECT COUNT(*) as total'),
      params
    );
    
    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    const result = await pool.query(query, params);
    
    return res.json({
      success: true,
      logs: result.rows,
      total: parseInt(countRes.rows[0]?.total || 0),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    logger.error({ err }, 'getAuditLogs error');
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Admin: Obtenir les graphiques d'activité
 * GET /api/admin/stats/activity-charts?period=7d
 */
async function getActivityCharts(req, res) {
  try {
    const period = req.query.period || '7d';
    
    // Validation de la période
    if (!['7d', '30d', '90d', 'all'].includes(period)) {
      return res.status(400).json({ 
        error: 'Période invalide. Valeurs acceptées: 7d, 30d, 90d, all' 
      });
    }

    logger.info({ period }, 'Fetching activity charts data');
    const stats = await adminStatsModel.getActivityCharts(period);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Error fetching activity charts');
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des graphiques d\'activité',
      details: error.message 
    });
  }
}

module.exports = {
  getGlobalStats,
  getRevenueStats,
  getAuditLogs,
  getActivityCharts
};
