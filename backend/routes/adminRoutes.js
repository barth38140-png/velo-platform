// backend/routes/adminRoutes.js
// Routes d'administration pour le système d'amélioration continue

const express = require('express');
const auth = require('../middlewares/auth');
const isAdmin = require('../middlewares/isAdmin');

module.exports = (config = {}) => {
  const router = express.Router();
  const { continuousImprovement, autoFixer, githubIntegration, predictiveAnalytics } = config;

  // Middleware: Vérifier que tous les composants sont disponibles
  const checkComponents = (req, res, next) => {
    if (!continuousImprovement || !autoFixer || !githubIntegration || !predictiveAnalytics) {
      return res.status(503).json({
        error: 'Composants du système d\'amélioration continue non disponibles'
      });
    }
    next();
  };

  router.use(auth, isAdmin, checkComponents);

  // GET /api/admin/ci/status - État du système d'amélioration continue
  router.get('/ci/status', (req, res) => {
    res.json({
      continuousImprovement: {
        enabled: continuousImprovement.config.enabled,
        metrics: continuousImprovement.calculateMetrics(),
        healthScore: continuousImprovement.getHealthScore()
      },
      autoFixer: {
        enabled: autoFixer.config.enabled,
        dryRun: autoFixer.config.dryRun,
        stats: autoFixer.getStats()
      },
      githubIntegration: {
        enabled: githubIntegration.enabled,
        issuesReport: githubIntegration.getCreatedIssuesReport()
      },
      predictiveAnalytics: {
        enabled: predictiveAnalytics.config.enabled,
        snapshot: predictiveAnalytics.getMetricsSnapshot()
      },
      timestamp: new Date()
    });
  });

  // GET /api/admin/ci/auto-fixes - Historique des auto-fixes
  router.get('/auto-fixes', (req, res) => {
    const limit = req.query.limit || 50;
    res.json({
      executionLog: autoFixer.getExecutionLog(parseInt(limit)),
      stats: autoFixer.getStats()
    });
  });

  // POST /api/admin/ci/auto-fixes/enable - Activer les auto-fixes
  router.post('/auto-fixes/enable', (req, res) => {
    autoFixer.config.enabled = true;
    autoFixer.config.dryRun = false;
    res.json({ message: 'Auto-fixes activés', stats: autoFixer.getStats() });
  });

  // POST /api/admin/ci/auto-fixes/disable - Désactiver les auto-fixes
  router.post('/auto-fixes/disable', (req, res) => {
    autoFixer.config.enabled = false;
    res.json({ message: 'Auto-fixes désactivés', stats: autoFixer.getStats() });
  });

  // POST /api/admin/ci/auto-fixes/dry-run - Activer le mode simulation
  router.post('/auto-fixes/dry-run', (req, res) => {
    autoFixer.config.dryRun = true;
    res.json({ message: 'Mode simulation activé', stats: autoFixer.getStats() });
  });

  // GET /api/admin/ci/github-issues - Rapport des issues GitHub créées
  router.get('/github-issues', (req, res) => {
    res.json(githubIntegration.getCreatedIssuesReport());
  });

  // GET /api/admin/ci/predictions - Prédictions et recommandations
  router.get('/predictions', async (req, res) => {
    try {
      const forecasts = await predictiveAnalytics.generateForecast();
      const recommendations = predictiveAnalytics.generateRecommendations();

      res.json({
        forecasts,
        recommendations,
        metricsSnapshot: predictiveAnalytics.getMetricsSnapshot(),
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/admin/ci/anomalies-detected - Anomalies détectées
  router.get('/anomalies-detected', (req, res) => {
    const limit = req.query.limit || 100;
    const metrics = continuousImprovement.calculateMetrics();

    // Analyser les anomalies actuelles
    const anomalies = continuousImprovement.anomalyDetector.analyze(metrics);

    res.json({
      total: anomalies.length,
      anomalies: anomalies.slice(0, parseInt(limit)),
      metrics,
      timestamp: new Date()
    });
  });

  // POST /api/admin/ci/force-health-check - Forcer une vérification d'état
  router.post('/force-health-check', async (req, res) => {
    try {
      const healthStatus = continuousImprovement.checkHealth();
      res.json({
        message: 'Vérification d\'état complétée',
        healthStatus,
        timestamp: new Date()
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // GET /api/admin/ci/logs - Logs du système CI
  router.get('/logs', (req, res) => {
    const limit = req.query.limit || 200;
    const type = req.query.type || 'all'; // all, auto-fixes, predictions, anomalies

    let logs = [];

    if (type === 'all' || type === 'auto-fixes') {
      logs.push(...autoFixer.executionLog.map(log => ({
        ...log,
        category: 'auto-fix'
      })));
    }

    // Ajouter d'autres types de logs selon les besoins

    // Trier par timestamp décroissant et limiter
    logs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.json({ logs });
  });

  // GET /api/admin/ci/system-health - Santé globale du système
  router.get('/system-health', async (req, res) => {
    try {
      const metricsData = continuousImprovement.calculateMetrics();
      const healthScore = continuousImprovement.getHealthScore();
      const autoFixesStats = autoFixer.getStats();
      const anomalies = continuousImprovement.anomalyDetector.analyze(metricsData);

      // Évaluer la santé globale
      const globalHealth = {
        score: healthScore,
        status: healthScore >= 80 ? 'healthy' : healthScore >= 50 ? 'degraded' : 'critical',
        uptime: metricsData.uptime,
        requestCount: metricsData.requests,
        errorRate: metricsData.errorRate,
        avgLatency: metricsData.avgLatency,
        anomaliesCount: anomalies.length,
        autoFixesStats,
        recommendations: predictiveAnalytics.generateRecommendations()
      };

      res.json(globalHealth);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // ===== Gestion Utilisateurs =====
  const userController = require('../controllers').userController;
  
  router.get('/users', userController.getAllUsersAdmin);
  router.put('/users/:userId/status', userController.toggleUserStatus);
  router.put('/users/:userId/verify', userController.verifyRepairerProfile);
  router.get('/users/pending-verifications', userController.getPendingVerifications);

  // ===== Modération =====
  const moderationController = require('../controllers').moderationController;
  
  router.get('/reviews/flagged', moderationController.getFlaggedReviews);
  router.post('/reviews/:reviewId/moderate', moderationController.moderateReview);
  router.get('/messages/flagged', moderationController.getFlaggedMessages);
  router.post('/messages/:messageId/moderate', moderationController.moderateMessage);

  // ===== Statistiques et Revenue =====
  const statsController = require('../controllers').statsController;
  
  router.get('/stats/global', statsController.getGlobalStats);
  router.get('/stats/revenue', statsController.getRevenueStats);
  router.get('/stats/audit-logs', statsController.getAuditLogs);
  router.get('/stats/activity-charts', statsController.getActivityCharts);

  return router;
};

