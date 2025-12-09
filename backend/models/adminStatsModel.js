const pool = require('../config/db');
const logger = require('pino')();

/**
 * Statistiques globales pour le dashboard admin
 * @param {string} period - Période : '7d', '30d', '90d', 'all'
 */
async function getGlobalStats(period = '7d') {
  try {
    const dateFilter = getPeriodFilter(period);
    
    // Statistiques utilisateurs
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*)::int as total_users,
        COUNT(*) FILTER (WHERE role = 'client')::int as total_clients,
        COUNT(*) FILTER (WHERE role = 'repairer')::int as total_repairers,
        COUNT(*) FILTER (WHERE created_at >= ${dateFilter})::int as new_users_period
      FROM users
    `);

    // Statistiques réparations
    const repairsStats = await pool.query(`
      SELECT 
        COUNT(*)::int as total_repairs,
        COUNT(*) FILTER (WHERE status = 'créée')::int as status_creee,
        COUNT(*) FILTER (WHERE status = 'en_attente')::int as status_en_attente,
        COUNT(*) FILTER (WHERE status = 'assignée')::int as status_assignee,
        COUNT(*) FILTER (WHERE status = 'en_cours')::int as status_en_cours,
        COUNT(*) FILTER (WHERE status = 'terminée')::int as status_terminee,
        COUNT(*) FILTER (WHERE status = 'annulée')::int as status_annulee,
        COUNT(*) FILTER (WHERE created_at >= ${dateFilter})::int as new_repairs_period,
        COUNT(*) FILTER (WHERE status = 'terminée' AND updated_at >= ${dateFilter})::int as completed_repairs_period
      FROM repair_requests
    `);

    // Vérifier la présence des colonnes price et estimated_duration
    const colCheck = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'repair_offers' AND column_name IN ('price','estimated_duration')");
    const hasPriceCol = colCheck.rows.some(r => r.column_name === 'price');
    const hasDurationCol = colCheck.rows.some(r => r.column_name === 'estimated_duration');

    let offersStats;
    let avgPriceExpr = hasPriceCol ? 'ROUND(AVG(price), 2) as avg_price' : 'NULL::numeric as avg_price';
    let avgDurationExpr = hasDurationCol ? 'ROUND(AVG(estimated_duration), 2) as avg_duration' : 'NULL::numeric as avg_duration';

    if (!hasPriceCol) logger.warn('Colonne price absente dans repair_offers, stats de prix ignorées');
    if (!hasDurationCol) logger.warn('Colonne estimated_duration absente dans repair_offers, stats de durée ignorées');

    offersStats = await pool.query(`
      SELECT 
        COUNT(*)::int as total_offers,
        COUNT(*) FILTER (WHERE status = 'proposée')::int as status_proposee,
        COUNT(*) FILTER (WHERE status = 'acceptée')::int as status_acceptee,
        COUNT(*) FILTER (WHERE status = 'rejetée')::int as status_rejetee,
        COUNT(*) FILTER (WHERE created_at >= ${dateFilter})::int as new_offers_period,
        ${avgPriceExpr},
        ${avgDurationExpr}
      FROM repair_offers
    `);

    // Taux de conversion (offres acceptées / total offres)
    const conversionRate = offersStats.rows[0].total_offers > 0
      ? ((offersStats.rows[0].status_acceptee / offersStats.rows[0].total_offers) * 100).toFixed(2)
      : 0;

    // Taux de complétion (demandes terminées / total demandes)
    const completionRate = repairsStats.rows[0].total_repairs > 0
      ? ((repairsStats.rows[0].status_terminee / repairsStats.rows[0].total_repairs) * 100).toFixed(2)
      : 0;

    return {
      period,
      users: usersStats.rows[0],
      repairs: repairsStats.rows[0],
      offers: offersStats.rows[0],
      metrics: {
        conversionRate: parseFloat(conversionRate),
        completionRate: parseFloat(completionRate),
        avgOffersPerRepair: repairsStats.rows[0].total_repairs > 0
          ? (offersStats.rows[0].total_offers / repairsStats.rows[0].total_repairs).toFixed(2)
          : 0
      },
      timestamp: new Date()
    };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to get global stats');
    throw error;
  }
}

/**
 * Statistiques de revenus
 * @param {string} period - Période : '7d', '30d', '90d', 'all'
 */
async function getRevenueStats(period = '7d') {
  try {
    const dateFilter = getPeriodFilter(period);

    // Vérifier la présence de la colonne price
    const colCheck = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_name = 'repair_offers' AND column_name = 'price' LIMIT 1");
    const hasPriceCol = colCheck && colCheck.rowCount > 0;

    let revenueByStatus, dailyRevenue, topRepairers, totalAcceptedRevenue;
    if (hasPriceCol) {
      revenueByStatus = await pool.query(`
        SELECT 
          status,
          COUNT(*)::int as count,
          COALESCE(SUM(price), 0)::numeric as total_revenue,
          COALESCE(ROUND(AVG(price), 2), 0)::numeric as avg_price
        FROM repair_offers
        WHERE created_at >= ${dateFilter}
        GROUP BY status
        ORDER BY status
      `);

      dailyRevenue = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as offers_count,
          COALESCE(SUM(price) FILTER (WHERE status = 'acceptée'), 0)::numeric as accepted_revenue,
          COALESCE(SUM(price), 0)::numeric as total_potential_revenue
        FROM repair_offers
        WHERE created_at >= ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      topRepairers = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.name,
          COUNT(ro.id)::int as offers_count,
          COUNT(ro.id) FILTER (WHERE ro.status = 'acceptée')::int as accepted_count,
          COALESCE(SUM(ro.price) FILTER (WHERE ro.status = 'acceptée'), 0)::numeric as total_revenue,
          COALESCE(ROUND(AVG(ro.price), 2), 0)::numeric as avg_offer_price
        FROM users u
        INNER JOIN repair_offers ro ON ro.repairer_id = u.id
        WHERE ro.created_at >= ${dateFilter}
        GROUP BY u.id, u.email, u.name
        ORDER BY total_revenue DESC
        LIMIT 10
      `);

      totalAcceptedRevenue = await pool.query(`
        SELECT 
          COALESCE(SUM(price), 0)::numeric as total
        FROM repair_offers
        WHERE status = 'acceptée' AND created_at >= ${dateFilter}
      `);
    } else {
      logger.warn('Colonne price absente dans repair_offers, stats de revenus ignorées');
      revenueByStatus = await pool.query(`
        SELECT 
          status,
          COUNT(*)::int as count,
          NULL::numeric as total_revenue,
          NULL::numeric as avg_price
        FROM repair_offers
        WHERE created_at >= ${dateFilter}
        GROUP BY status
        ORDER BY status
      `);

      dailyRevenue = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as offers_count,
          NULL::numeric as accepted_revenue,
          NULL::numeric as total_potential_revenue
        FROM repair_offers
        WHERE created_at >= ${dateFilter}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      topRepairers = await pool.query(`
        SELECT 
          u.id,
          u.email,
          u.name,
          COUNT(ro.id)::int as offers_count,
          COUNT(ro.id) FILTER (WHERE ro.status = 'acceptée')::int as accepted_count,
          NULL::numeric as total_revenue,
          NULL::numeric as avg_offer_price
        FROM users u
        INNER JOIN repair_offers ro ON ro.repairer_id = u.id
        WHERE ro.created_at >= ${dateFilter}
        GROUP BY u.id, u.email, u.name
        ORDER BY offers_count DESC
        LIMIT 10
      `);

      totalAcceptedRevenue = await pool.query(`
        SELECT NULL::numeric as total
      `);
    }

    return {
      period,
      totalAcceptedRevenue: totalAcceptedRevenue.rows[0].total,
      revenueByStatus: revenueByStatus.rows,
      dailyRevenue: dailyRevenue.rows,
      topRepairers: topRepairers.rows,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to get revenue stats');
    throw error;
  }
}

/**
 * Données pour graphiques d'activité
 * @param {string} period - Période : '7d', '30d', '90d', 'all'
 */
async function getActivityCharts(period = '7d') {
  try {
    const dateFilter = getPeriodFilter(period);

    // Activité quotidienne (demandes créées)
    const dailyRepairs = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count,
        COUNT(*) FILTER (WHERE status = 'terminée')::int as completed,
        COUNT(*) FILTER (WHERE status = 'annulée')::int as cancelled
      FROM repair_requests
      WHERE created_at >= ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Activité quotidienne (offres soumises)
    const dailyOffers = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*)::int as count,
        COUNT(*) FILTER (WHERE status = 'acceptée')::int as accepted,
        COUNT(*) FILTER (WHERE status = 'rejetée')::int as rejected
      FROM repair_offers
      WHERE created_at >= ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Distribution des statuts de réparations
    const repairStatusDistribution = await pool.query(`
      SELECT 
        status,
        COUNT(*)::int as count
      FROM repair_requests
      GROUP BY status
      ORDER BY count DESC
    `);

    // Distribution des types de vélos
    const bikeTypeDistribution = await pool.query(`
      SELECT 
        COALESCE(bike_type, 'Non spécifié') as bike_type,
        COUNT(*)::int as count
      FROM repair_requests
      WHERE created_at >= ${dateFilter}
      GROUP BY bike_type
      ORDER BY count DESC
      LIMIT 10
    `);

    // Temps moyen de résolution (de créée à terminée)
    const avgResolutionTime = await pool.query(`
      SELECT 
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600), 2) as avg_hours
      FROM repair_requests
      WHERE status = 'terminée' AND created_at >= ${dateFilter}
    `);

    return {
      period,
      dailyRepairs: dailyRepairs.rows,
      dailyOffers: dailyOffers.rows,
      repairStatusDistribution: repairStatusDistribution.rows,
      bikeTypeDistribution: bikeTypeDistribution.rows,
      avgResolutionTimeHours: avgResolutionTime.rows[0]?.avg_hours || 0,
      timestamp: new Date()
    };
  } catch (error) {
    logger.error({ error: error.message, stack: error.stack }, 'Failed to get activity charts');
    throw error;
  }
}

/**
 * Génère le filtre SQL pour la période
 * @param {string} period - '7d', '30d', '90d', 'all'
 * @returns {string} - Expression SQL pour le filtre de date
 */
function getPeriodFilter(period) {
  switch (period) {
    case '7d':
      return "NOW() - INTERVAL '7 days'";
    case '30d':
      return "NOW() - INTERVAL '30 days'";
    case '90d':
      return "NOW() - INTERVAL '90 days'";
    case 'all':
    default:
      return "'1970-01-01'::timestamp"; // Toutes les données
  }
}

module.exports = {
  getGlobalStats,
  getRevenueStats,
  getActivityCharts
};
