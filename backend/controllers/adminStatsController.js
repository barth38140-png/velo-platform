const adminStatsModel = require('../models/adminStatsModel');
const logger = require('pino')();

/**
 * GET /api/admin/stats/global?period=7d
 * Retourne les statistiques globales de la plateforme
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
 * GET /api/admin/stats/revenue?period=7d
 * Retourne les statistiques de revenus
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
 * GET /api/admin/stats/activity-charts?period=7d
 * Retourne les données pour les graphiques d'activité
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
  getActivityCharts
};
